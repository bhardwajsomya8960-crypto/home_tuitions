const geoService = require('./geoService');

class MatchingService {
  constructor() {
    // Default matching weights (configurable from admin)
    this.weights = {
      distance: 0.30,
      subjectFit: 0.25,
      availability: 0.15,
      experience: 0.10,
      quality: 0.10,
      acceptanceReliability: 0.05,
      feeFit: 0.05
    };

    // Configuration
    this.config = {
      minTutorStatus: 'verified',
      homeRadius: 8,
      maxExtendedRadius: 12,
      offerTimeout: 10 * 60 * 1000 // 10 minutes
    };
  }

  // Update matching weights from admin
  updateWeights(newWeights) {
    this.weights = { ...this.weights, ...newWeights };
  }

  // Calculate matching score for a lead-tutor pair
  calculateScore(lead, tutor, adminConfig = {}) {
    const config = { ...this.config, ...adminConfig };

    // Hard filters (must pass)
    if (tutor.verification_status !== config.minTutorStatus) {
      return null;
    }

    if (!tutor.subjects.includes(lead.subjects[0])) {
      return null;
    }

    // Distance score (inverse: closer = higher)
    const distance = geoService.calculateDistance(
      lead.latitude, lead.longitude,
      tutor.latitude, tutor.longitude
    );

    if (distance > config.maxExtendedRadius) {
      return null;
    }

    const distanceScore = Math.max(0, 100 - (distance / config.maxExtendedRadius) * 100);

    // Subject/class/board fit
    const subjectFitScore = this.calculateSubjectFit(lead, tutor);

    // Availability score
    const availabilityScore = this.calculateAvailability(lead, tutor);

    // Experience score (normalized 0-100)
    const experienceScore = Math.min(100, (tutor.experience || 0) * 10);

    // Quality score (from rating, normalized 0-100)
    const qualityScore = (tutor.rating || 0) * 20;

    // Acceptance reliability (mock data)
    const acceptanceReliabilityScore = (tutor.acceptance_rate || 0.8) * 100;

    // Fee fit score
    const feeFitScore = this.calculateFeeFit(lead, tutor);

    // Calculate weighted score
    const finalScore =
      (distanceScore * this.weights.distance) +
      (subjectFitScore * this.weights.subjectFit) +
      (availabilityScore * this.weights.availability) +
      (experienceScore * this.weights.experience) +
      (qualityScore * this.weights.quality) +
      (acceptanceReliabilityScore * this.weights.acceptanceReliability) +
      (feeFitScore * this.weights.feeFit);

    return {
      tutorId: tutor.id,
      score: Math.round(finalScore),
      distance,
      distanceScore,
      subjectFitScore,
      availabilityScore,
      experienceScore,
      qualityScore,
      acceptanceReliabilityScore,
      feeFitScore,
      reasons: {
        distance: `${distance.toFixed(1)} km away`,
        subjectFit: 'Teaches required subject and class',
        availability: 'Available on preferred days/times'
      }
    };
  }

  // Calculate subject/class/board fit (0-100)
  calculateSubjectFit(lead, tutor) {
    let score = 0;

    // Subject match (50 points)
    if (tutor.subjects.includes(lead.subjects[0])) {
      score += 50;
    }

    // Class match (30 points)
    if (tutor.classes.includes(lead.class)) {
      score += 30;
    }

    // Board match (20 points)
    if (tutor.boards.includes(lead.board)) {
      score += 20;
    }

    return score;
  }

  // Calculate availability score (0-100)
  calculateAvailability(lead, tutor) {
    const preferredDays = lead.preferred_days || [];
    const tutorAvailableDays = tutor.available_days || [];

    const matchingDays = preferredDays.filter(day =>
      tutorAvailableDays.includes(day)
    ).length;

    return (matchingDays / Math.max(1, preferredDays.length)) * 100;
  }

  // Calculate fee fit (0-100)
  calculateFeeFit(lead, tutor) {
    const parentBudget = lead.budget || 500;
    const tutorFee = tutor.expected_fee || 500;

    if (Math.abs(parentBudget - tutorFee) <= 100) {
      return 100;
    }

    if (Math.abs(parentBudget - tutorFee) <= 200) {
      return 70;
    }

    return 40;
  }

  // Rank tutors for a lead
  rankTutorsForLead(lead, tutors, adminConfig = {}) {
    const scored = tutors
      .map(tutor => this.calculateScore(lead, tutor, adminConfig))
      .filter(score => score !== null)
      .sort((a, b) => b.score - a.score);

    return scored;
  }

  // Get assignment expiry time
  getAssignmentExpiry() {
    return new Date(Date.now() + this.config.offerTimeout);
  }
}

module.exports = new MatchingService();
