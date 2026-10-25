# Deploying on AWS (EC2 + MongoDB Atlas + S3)

This sets up production on **one EC2 machine** running three containers, with all data kept outside the machine:

```
Browser ──HTTPS──▶ EC2: Caddy ──▶ web (Next.js, port 3000)
                         └─/api──▶ api (Express, port 5000) ──▶ MongoDB Atlas (database)
                                                         └──▶ S3 bucket (tutor KYC files)
```

- **Caddy** gets and renews the HTTPS certificate automatically.
- **MongoDB Atlas** holds every record: accounts, leads, offers, classes, invoices and the audit log.
- **S3** holds the uploaded KYC documents. The bucket is private and encrypted, and the API streams each file only to its owner or to staff.
- **The EC2 machine stores no data.** You can rebuild or replace it without losing anything.

Region: use **ap-south-1 (Mumbai)** for EC2 and S3, and the same region in Atlas (AWS / Mumbai), so traffic stays in India and latency is low.

---

## 1. MongoDB Atlas

1. Create an account at [mongodb.com/atlas](https://www.mongodb.com/atlas) and a project.
2. Create a cluster on **AWS, ap-south-1 (Mumbai)**.
   - **M0 (free)** works for trying the setup. It has no backups and shared limits.
   - **M10 or above** for real users: continuous backups and point-in-time restore. Turn backups on.
3. **Database Access** → add a user, for example `tutorhub-api`, with a long random password and the role *Read and write to any database* (or a custom role limited to the `hometutor` database).
4. **Network Access** → add the EC2 machine's **Elastic IP** (step 3) only. Do not use `0.0.0.0/0`.
5. **Connect → Drivers** → copy the connection string and add the database name `hometutor`:
   `mongodb+srv://tutorhub-api:<password>@cluster0.xxxxx.mongodb.net/hometutor?retryWrites=true&w=majority`

The API creates its collections and indexes on first start. Atlas clusters are replica sets, so multi-document transactions (used when a tutor accepts a lead, payments, conversions) are on.

## 2. S3 bucket and access

1. **S3 → Create bucket**, for example `yourname-tutorhub-kyc-documents`, region ap-south-1.
   - Keep **Block all public access** on.
   - Default encryption: SSE-S3 (the API also asks for encryption on every upload).
   - Turn on **Bucket Versioning**, so a deleted or overwritten file can be recovered.
2. **IAM → Policies → Create policy** → JSON → paste `iam-s3-policy.json` from this folder, with your bucket name in place of `REPLACE-tutorhub-kyc-documents`. It allows only put, get and delete under `tutor-documents/`.
3. **IAM → Roles → Create role** → *AWS service: EC2* → attach the policy. Name it `tutorhub-ec2`.

The API uses this role automatically. No AWS keys go in any file.

## 3. EC2 machine

1. **EC2 → Launch instance**
   - Ubuntu Server 24.04 LTS, 64-bit (x86).
   - **t3.small** (2 GB) is the minimum. **t3.medium** (4 GB) is more comfortable, because the website is built on the machine.
   - Storage: 30 GB gp3.
   - Security group:
     - inbound 22 (SSH) from **your IP only**
     - inbound 80 and 443 from anywhere
   - Advanced → IAM instance profile: `tutorhub-ec2`.
2. **Elastic IPs → Allocate** and associate it with the instance. Add this IP in Atlas Network Access (step 1.4).
3. **Allow the containers to use the instance role.** Docker containers are one network hop further away, so raise the metadata hop limit to 2 (AWS CLI or CloudShell):
   ```bash
   aws ec2 modify-instance-metadata-options --instance-id i-xxxxxxxx \
     --http-tokens required --http-put-response-hop-limit 2
   ```
   Without this, uploads fail with a credentials error.
4. **DNS:** at your domain provider, add an **A record** for the domain, and for `www`, pointing to the Elastic IP.

## 4. Install and start

SSH in (`ssh ubuntu@<elastic-ip>`), then:

```bash
# Docker, a swap file and the code
curl -fsSL -o ec2-setup.sh https://raw.githubusercontent.com/<owner>/<repo>/main/deploy/aws/ec2-setup.sh
bash ec2-setup.sh https://github.com/<owner>/<repo>.git
exit   # log in again so docker works without sudo

ssh ubuntu@<elastic-ip>
cd ~/app/deploy/aws
cp .env.production.example .env.production
nano .env.production    # domain, Atlas URI, bucket, secrets (see comments in the file)
```

- **Private repository:** clone with a deploy key or a GitHub token instead of the plain URL.
- **Admin password hash:** create it on the server with the command in `.env.production.example`, then put it in single quotes.
- **Secrets:** generate each one with `openssl rand -hex 32`.

Start everything:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
docker compose --env-file .env.production -f docker-compose.prod.yml logs -f api
```

The first build takes a few minutes. Then:

- `https://<your-domain>/health` returns `{"status":"ok","db":"up",...}`.
- `https://<your-domain>/admin/login` signs in with `ADMIN_EMAIL` and the password you hashed.

Optional sample catalogue content:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml exec api node scripts/seed-catalogue.js --sample
```

## 5. Updating

```bash
cd ~/app/deploy/aws && ./deploy.sh
```

This pulls the latest code, rebuilds, and restarts only the containers that changed. Database and files are untouched.

## 6. Day-to-day

| Task | How |
|---|---|
| **Logs** | `docker compose --env-file .env.production -f docker-compose.prod.yml logs -f api` (also `web`, `caddy`) |
| **Restart** | `... restart api` |
| **Backups** | Atlas backups (M10+) cover the database. S3 versioning covers files. The machine has nothing to back up. |
| **Sign-in codes** | No SMS provider is connected yet. Codes are written to the API log (`logs -f api`). Connect an SMS gateway before launch. |
| **Health monitoring** | Point an uptime checker (for example UptimeRobot or Route 53 health checks) at `/health`. |
| **Costs (approx.)** | t3.small ≈ US$15–20/month; Atlas M0 free, M10 ≈ US$57/month; S3 a few cents per GB. |

## 7. Growing later

- **More than one API server:** put an Application Load Balancer in front of several EC2 machines, or move the containers to ECS. Most of the app is ready for this: sessions are signed tokens, files are in S3, and offer expiry is safe to run on every server. One thing must change first: one-time codes and the admin login limiter are kept in each server's memory, so a code sent by one server cannot be checked by another. Move them to MongoDB or Redis before running more than one API server.
- **Build images elsewhere:** build in GitHub Actions, push to ECR, and only pull on the server. This lets a t3.small run comfortably.
