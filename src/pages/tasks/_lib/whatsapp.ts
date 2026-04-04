const WHATSAPP_NUMBER = "6287789317769";

type TaskMessageData = {
  title: string;
  projectName: string;
  divisionName: string | null;
  assigneeName: string;
  priority: string;
  deadline: string;
  status: string;
  progressPercentage: number;
  budgetAllocated: number;
  budgetRealized: number;
  notes: string;
};

const STATUS_LABELS: Record<string, string> = {
  not_started: "Not Started",
  in_progress: "In Progress",
  complete: "Complete",
  overdue: "Overdue",
};

/**
 * Format Rupiah inline for WhatsApp messages (plain text, no Intl)
 */
function formatRp(value: number): string {
  return `Rp ${value.toLocaleString("id-ID")}`;
}

/**
 * Build a formatted WhatsApp message from task details
 */
function buildTaskMessage(task: TaskMessageData): string {
  const statusLabel = STATUS_LABELS[task.status] ?? task.status;
  const lines = [
    `*📋 New Task Assignment*`,
    ``,
    `*Title:* ${task.title}`,
    `*Project:* ${task.projectName}`,
    task.divisionName ? `*Division:* ${task.divisionName}` : null,
    `*Assignee (PIC):* ${task.assigneeName}`,
    `*Priority:* ${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}`,
    `*Deadline:* ${task.deadline}`,
    `*Status:* ${statusLabel}`,
    `*Progress:* ${task.progressPercentage}%`,
    `*Budget Allocated:* ${formatRp(task.budgetAllocated)}`,
    task.budgetRealized > 0
      ? `*Budget Realized:* ${formatRp(task.budgetRealized)}`
      : null,
    task.notes ? `\n*Notes:* ${task.notes}` : null,
  ];

  return lines.filter(Boolean).join("\n");
}

/**
 * Open WhatsApp with a pre-filled task message
 */
export function sendTaskToWhatsApp(task: TaskMessageData): void {
  const message = buildTaskMessage(task);
  const encoded = encodeURIComponent(message);
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`;
  window.open(url, "_blank", "noopener,noreferrer");
}
