
const express = require('express');
const router = express.Router();

const User = require('../models/User');
const Debate = require('../models/Debate');
const verifyToken = require('../middleware/authMiddleware');

router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');

    if (!user) {
      return res.status(404).json({
        message: 'User not found.'
      });
    }

    const debates = await Debate.find({
      userId: req.user.id
    })
      .select(
        'topic position difficulty status winner userScore aiScore criterionScores createdAt updatedAt'
      )
      .sort({ updatedAt: -1 })
      .lean();

    const completedDebates = debates.filter(
      (debate) => debate.status === 'COMPLETED'
    );

    const wins = completedDebates.filter(
      (debate) => debate.winner === 'USER'
    ).length;

    const losses = completedDebates.filter(
      (debate) => debate.winner === 'AI'
    ).length;

    const draws = completedDebates.filter(
      (debate) => debate.winner === 'DRAW'
    ).length;

    const averageScore = completedDebates.length
      ? completedDebates.reduce(
          (total, debate) => total + (debate.userScore || 0),
          0
        ) / completedDebates.length
      : 0;

    const criteria = [
      'argumentQuality',
      'evidenceExamples',
      'rebuttals',
      'clarityCommunication',
      'relevanceReasoning'
    ];

    const criterionLabels = {
      argumentQuality: 'Argument Quality',
      evidenceExamples: 'Evidence & Examples',
      rebuttals: 'Rebuttals',
      clarityCommunication: 'Clarity & Communication',
      relevanceReasoning: 'Relevance & Reasoning'
    };

    const performance = criteria.map((criterion) => {
      const evaluatedDebates = completedDebates.filter(
        (debate) =>
          Number.isFinite(
            debate.criterionScores?.[criterion]?.userScore
          )
      );

      const average = evaluatedDebates.length
        ? evaluatedDebates.reduce(
            (total, debate) =>
              total + debate.criterionScores[criterion].userScore,
            0
          ) / evaluatedDebates.length
        : 0;

      return {
        key: criterion,
        label: criterionLabels[criterion],
        average: Math.round(average * 10) / 10
      };
    });

    return res.status(200).json({
      message: 'Profile retrieved successfully.',
      user,
      stats: {
        totalDebates: debates.length,
        completedDebates: completedDebates.length,
        activeDebates: debates.filter(
          (debate) => debate.status === 'ACTIVE'
        ).length,
        wins,
        losses,
        draws,
        averageScore: Math.round(averageScore * 10) / 10,
        winRate: completedDebates.length
          ? Math.round((wins / completedDebates.length) * 100)
          : 0
      },
      performance,
      recentDebates: debates.slice(0, 5)
    });

  } catch (error) {
    console.error('Fetch profile error:', error.message);

    return res.status(500).json({
      message: 'Unable to fetch profile details.'
    });
  }
});

router.patch('/me', verifyToken, async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        message: 'Name is required.'
      });
    }

    if (name.trim().length < 2 || name.trim().length > 50) {
      return res.status(400).json({
        message: 'Name must be between 2 and 50 characters.'
      });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        message: 'User not found.'
      });
    }

    user.name = name.trim();
    await user.save();

    const updatedUser = await User.findById(req.user.id)
      .select('-password');

    return res.status(200).json({
      message: 'Profile updated successfully.',
      user: updatedUser
    });

  } catch (error) {
    console.error('Update profile error:', error.message);

    return res.status(500).json({
      message: 'Unable to update profile.'
    });
  }
});

module.exports = router;
