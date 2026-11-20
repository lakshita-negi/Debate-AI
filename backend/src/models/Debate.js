
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ['USER', 'AI'],
      required: true
    },

    content: {
      type: String,
      required: true,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

const criterionScoreSchema = new mongoose.Schema(
  {
    userScore: {
      type: Number,
      min: 0,
      max: 10,
      required: true
    },

    aiScore: {
      type: Number,
      min: 0,
      max: 10,
      required: true
    },

    weight: {
      type: Number,
      required: true
    }
  },
  {
    _id: false
  }
);

const debateSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },

    topic: {
      type: String,
      required: true,
      trim: true
    },

    position: {
      type: String,
      enum: ['FOR', 'AGAINST'],
      required: true
    },

    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'intermediate'
    },

    duration: {
      type: Number,
      enum: [5, 10, 30]
    },

    startedAt: {
      type: Date
    },

    endsAt: {
      type: Date,
      index: true
    },

    status: {
      type: String,
      enum: ['ACTIVE', 'COMPLETED'],
      default: 'ACTIVE'
    },

    openingStatus: {
      type: String,
      enum: ['NOT_REQUIRED', 'NOT_STARTED', 'GENERATING', 'GENERATED', 'FAILED'],
      default: 'NOT_STARTED'
    },

    messages: [messageSchema],

    evaluationStatus: {
      type: String,
      enum: ['NOT_STARTED', 'GENERATING', 'COMPLETED', 'FAILED'],
      default: 'NOT_STARTED'
    },

    winner: {
      type: String,
      enum: ['USER', 'AI', 'DRAW']
    },

    userScore: {
      type: Number,
      min: 0,
      max: 10
    },

    aiScore: {
      type: Number,
      min: 0,
      max: 10
    },

    criterionScores: {
      argumentQuality: criterionScoreSchema,
      evidenceExamples: criterionScoreSchema,
      rebuttals: criterionScoreSchema,
      clarityCommunication: criterionScoreSchema,
      relevanceReasoning: criterionScoreSchema
    },

    evaluation: {
      overallScore: Number,
      argumentation: Number,
      clarity: Number,
      relevance: Number,
      feedback: String,
      strengths: [String],
      improvements: [String],

      summary: String,
      userFeedback: String,
      aiFeedback: String,
      userStrengths: [String],
      userImprovements: [String],
      aiStrengths: [String]
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Debate', debateSchema);
