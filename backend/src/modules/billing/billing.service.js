const specs = require('./billing.validation')
const { pageParams } = require('../../shared/utils/pagination')
const { mapSeries } = require('../../shared/utils/async')

// Invoices and manual payments (blueprint §12.7). No payment gateway yet.
function createBillingService(ctx) {
  const { repo } = ctx

  const self = {
    async createInvoice(body, actor) {
      const v = ctx.validate(body, specs.invoiceSpec)
      const e = await ctx.require('Enrolment', v.enrolmentId, 'Enrolment')
      const stamp = ctx.iso()
      const invoice = await repo.insert('Invoice', {
        id: ctx.newId(), number: await repo.nextSequence('invoices', 'HT-INV-'), enrolmentId: e.id, parentId: e.parentId, studentId: e.studentId,
        periodLabel: v.periodLabel, amount: v.amount, amountPaid: 0, dueDate: v.dueDate, status: 'pending', createdAt: stamp, updatedAt: stamp,
      })
      await ctx.audit(actor, 'invoice.create', 'invoice', invoice.id, { amount: v.amount })
      return invoice
    },

    async recordPayment(invoiceId, body, actor) {
      const v = ctx.validate(body, specs.paymentSpec)
      return repo.transaction(async () => {
        const inv = await ctx.require('Invoice', invoiceId, 'Invoice')
        if (!['pending', 'partial'].includes(inv.status)) throw ctx.conflict('INVOICE_CLOSED', `This invoice is ${inv.status}`)
        const outstanding = inv.amount - inv.amountPaid
        if (v.amount > outstanding) throw ctx.invalid([{ field: 'amount', message: `is more than the ₹${outstanding} outstanding` }])
        const payment = await repo.insert('Payment', {
          id: ctx.newId(), invoiceId: inv.id, amount: v.amount, method: v.method, reference: v.reference || null,
          paidOn: v.paidOn, notes: v.notes || null, recordedBy: actor, createdAt: ctx.iso(),
        })
        const paid = inv.amountPaid + v.amount
        // Conditional on the amount read above, so two payments recorded at once cannot overpay.
        if (!(await repo.update('Invoice', inv.id, { amountPaid: paid, status: paid >= inv.amount ? 'paid' : 'partial', updatedAt: ctx.iso() }, { amountPaid: inv.amountPaid }))) {
          throw ctx.conflict('STALE', 'This invoice has just changed. Reload and try again.')
        }
        await ctx.audit(actor, 'payment.record', 'invoice', inv.id, { amount: v.amount, method: v.method })
        return { payment, invoice: await repo.get('Invoice', inv.id) }
      })
    },

    async voidInvoice(invoiceId, actor) {
      const inv = await ctx.require('Invoice', invoiceId, 'Invoice')
      if (inv.amountPaid > 0 || inv.status !== 'pending') throw ctx.conflict('INVOICE_HAS_PAYMENTS', 'Only an unpaid invoice can be voided')
      await repo.update('Invoice', inv.id, { status: 'void', updatedAt: ctx.iso() })
      await ctx.audit(actor, 'invoice.void', 'invoice', inv.id)
      return repo.get('Invoice', inv.id)
    },

    async invoiceView(inv) {
      return {
        ...inv,
        outstanding: inv.status === 'void' ? 0 : inv.amount - inv.amountPaid,
        overdue: ['pending', 'partial'].includes(inv.status) && inv.dueDate < ctx.today(),
        payments: await repo.find('Payment', { invoiceId: inv.id }, { sort: { createdAt: 1 } }),
      }
    },

    async listInvoices(query) {
      const { limit, offset, page } = pageParams(query)
      const filters = ['pending', 'partial', 'paid', 'void'].includes(query.status) ? { status: query.status } : {}
      let items = await mapSeries(await repo.find('Invoice', filters), self.invoiceView)
      if (query.overdue === 'true') items = items.filter(i => i.overdue)
      const named = await mapSeries(items, async i => ({ ...i, parentName: (await repo.get('Parent', i.parentId))?.name, studentName: (await repo.get('Student', i.studentId))?.name }))
      return { items: named.slice(offset, offset + limit), total: named.length, page, limit }
    },
  }
  return self
}

module.exports = { createBillingService }
