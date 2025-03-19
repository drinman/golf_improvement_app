// Tutorial steps for new users
export interface TutorialStep {
  id: string;
  title: string;
  content: string;
  image: string;
}

export const tutorialSteps: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to UpSwing!',
    content: 'Welcome to UpSwing, your personal golf improvement assistant. This short tutorial will help you get started with all the key features to improve your golf game.',
    image: '/images/tutorial/welcome.png'
  },
  {
    id: 'dashboard',
    title: 'Your Dashboard',
    content: 'The Dashboard is your home base. Here you can see your practice stats, current goals, recent activity, and track your streak. The more consistently you practice, the longer your streak will grow!',
    image: '/images/tutorial/dashboard.png'
  },
  {
    id: 'goals',
    title: 'Setting Goals',
    content: 'Click on "Add Goal" in the Goals section of your Dashboard to set specific, measurable goals. You can track progress for skills like driving distance, putting accuracy, or any other area you want to improve. Good goals are specific and measurable!',
    image: '/images/tutorial/goals.png'
  },
  {
    id: 'practice_plans',
    title: 'Creating Practice Plans',
    content: 'Go to the Practice Planner to create structured practice routines. You can use the AI Coach to generate plans based on your goals, or create your own custom plans. A good practice plan focuses on specific skills and includes deliberate practice exercises.',
    image: '/images/tutorial/practice-plan.png'
  },
  {
    id: 'logging_practice',
    title: 'Logging Practice Sessions',
    content: 'After practicing, click "Log Session" to record what you worked on, for how long, and any notes or metrics. Regular logging helps you track improvement over time and identify patterns in your practice habits.',
    image: '/images/tutorial/log-session.png'
  },
  {
    id: 'connecting_sessions',
    title: 'Connecting Sessions to Plans',
    content: "When logging a session, you can select which practice plan it was part of. This helps you track which plans you're completing and how they're contributing to your progress toward your goals.",
    image: '/images/tutorial/connect-session.png'
  },
  {
    id: 'monthly_recap',
    title: 'Monthly Progress Recap',
    content: "At the end of each month, visit the Monthly Recap page to see how you've progressed. You'll get insights about practice time, goal progress, and areas to focus on next month.",
    image: '/images/tutorial/monthly-recap.png'
  },
  {
    id: 'streak_motivation',
    title: 'Stay Motivated with Streaks',
    content: "Practice consistently to build your streak! Even short practice sessions count toward your streak as long as you log them. Try not to break your streak - consistency is key to improvement.",
    image: '/images/tutorial/streak.png'
  },
  {
    id: 'final',
    title: "You're Ready to Go!",
    content: "Now you know the basics of UpSwing! Remember, the key to improvement is consistent, deliberate practice. Set goals, create plans, log your sessions, and watch your golf game transform.",
    image: '/images/tutorial/final.png'
  }
]; 