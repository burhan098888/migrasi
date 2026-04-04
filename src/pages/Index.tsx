import { SignInButton } from "@/components/ui/signin.tsx";
import { useAuth } from "@/hooks/use-auth.ts";
import { useDemoMode } from "@/hooks/use-demo-mode.tsx";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import {
  LayoutDashboard,
  ListTodo,
  BarChart3,
  CalendarDays,
  DollarSign,
  Users,
  ArrowRight,
  CheckCircle2,
  Shield,
  Zap,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button.tsx";

const features = [
  {
    icon: ListTodo,
    title: "Master Task Manager",
    description:
      "Create, assign, and track tasks across projects and divisions with deadline and budget management.",
  },
  {
    icon: LayoutDashboard,
    title: "Personal Workspace",
    description:
      "Every team member gets a personalized task board to update progress and leave remarks.",
  },
  {
    icon: BarChart3,
    title: "Live Analytics",
    description:
      "Real-time dashboards with completion rates, priority breakdowns, and filterable reports.",
  },
  {
    icon: CalendarDays,
    title: "Interactive Calendar",
    description:
      "Visualize deadlines, milestones, and holidays in a unified monthly calendar view.",
  },
  {
    icon: DollarSign,
    title: "Budget Tracking",
    description:
      "Compare allocated vs. realized budgets per project with automatic roll-up calculations.",
  },
  {
    icon: Shield,
    title: "Role-Based Access",
    description:
      "Admins, managers, and staff each get tailored permissions and views for security.",
  },
];

const benefits = [
  "Auto-overdue detection when deadlines pass",
  "Auto-calculated project progress from task averages",
  "Budget variance tracking across all projects",
  "Holiday-aware deadline management",
  "Division-based task organization",
  "Real-time collaborative updates",
];

export default function Index() {
  const { isAuthenticated, isLoading } = useAuth();
  const { enterDemoMode } = useDemoMode();
  const navigate = useNavigate();

  const handleTryDemo = () => {
    enterDemoMode();
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 inset-x-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center">
              H
            </div>
            <div>
              <span className="font-bold text-foreground">Hashinah</span>
              <span className="hidden sm:inline text-xs text-muted-foreground ml-2 uppercase tracking-wider">
                Project Tracker
              </span>
            </div>
          </div>
          {isAuthenticated ? (
            <Button onClick={() => navigate("/dashboard")} size="sm">
              Go to Dashboard
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <SignInButton size="sm" signInText="Get Started" />
          )}
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-40 right-1/4 w-72 h-72 bg-accent/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium mb-8">
              <Zap className="w-3.5 h-3.5" />
              Spreadsheet tracking, reimagined
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground text-balance leading-tight"
          >
            Track projects.
            <br />
            <span className="text-primary">Deliver results.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto text-balance"
          >
            Hashinah replaces your spreadsheet tracker with a powerful web
            application. Manage tasks, budgets, deadlines, and team workloads —
            all in one place.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            {isAuthenticated ? (
              <Button
                size="lg"
                onClick={() => navigate("/dashboard")}
                className="px-8"
              >
                Open Dashboard
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <SignInButton
                  size="lg"
                  signInText="Start Tracking"
                  className="px-8"
                />
                <Button
                  size="lg"
                  variant="secondary"
                  onClick={handleTryDemo}
                  className="px-8"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Try Demo
                </Button>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              Everything you need to manage projects
            </h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
              From task assignment to budget reconciliation — built for teams
              that need structure and visibility.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="bg-card border border-border rounded-xl p-6 hover:shadow-lg hover:border-primary/20 transition-all group"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <feature.icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-4">
                Smart automation, less manual work
              </h2>
              <p className="text-muted-foreground mb-8">
                Hashinah automates the tedious parts of project tracking so your
                team can focus on delivery.
              </p>
              <ul className="space-y-3">
                {benefits.map((benefit) => (
                  <motion.li
                    key={benefit}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    className="flex items-start gap-3"
                  >
                    <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground">{benefit}</span>
                  </motion.li>
                ))}
              </ul>
            </div>
            <div className="bg-muted/50 rounded-2xl p-8 border border-border">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Project Alpha
                  </span>
                  <span className="text-sm font-mono font-semibold text-primary">
                    78%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-border overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: "78%" }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, delay: 0.3 }}
                    className="h-full bg-primary rounded-full"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Budget Tracker
                  </span>
                  <span className="text-sm font-mono font-semibold text-accent-foreground">
                    $42.5k / $50k
                  </span>
                </div>
                <div className="h-2 rounded-full bg-border overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: "85%" }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className="h-full bg-accent rounded-full"
                  />
                </div>
                <div className="grid grid-cols-3 gap-3 pt-4">
                  {[
                    { label: "Tasks", value: "124" },
                    { label: "On Time", value: "96%" },
                    { label: "Team", value: "18" },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="text-center p-3 bg-background rounded-lg border border-border"
                    >
                      <p className="text-lg font-bold text-foreground">
                        {stat.value}
                      </p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                        {stat.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-primary/5">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Ready to ditch the spreadsheet?
          </h2>
          <p className="text-muted-foreground mb-8">
            Sign in to start managing your projects with Hashinah.
          </p>
          {isAuthenticated ? (
            <Button
              size="lg"
              onClick={() => navigate("/dashboard")}
              className="px-8"
            >
              Go to Dashboard
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <SignInButton
                size="lg"
                signInText="Get Started Free"
                className="px-8"
              />
              <Button
                size="lg"
                variant="secondary"
                onClick={handleTryDemo}
                className="px-8"
              >
                <Eye className="w-4 h-4 mr-2" />
                Try Demo
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center">
              H
            </div>
            <span className="text-sm font-semibold text-foreground">
              Hashinah Project Tracker
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Hashinah. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
