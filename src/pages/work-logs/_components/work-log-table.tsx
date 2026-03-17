import { useState, useMemo } from "react";
import { format } from "date-fns";
import { FileText, Search, Filter, User, Tag } from "lucide-react";
import { Input } from "@/components/ui/input.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";

type WorkLog = {
  _id: string;
  date: string;
  picName: string;
  category: string;
  description: string;
};

type Summary = {
  totalLogs: number;
  byPic: Record<string, number>;
  byCategory: Record<string, number>;
  byDate: Record<string, number>;
};

type WorkLogTableProps = {
  logs: WorkLog[];
  summary: Summary | undefined;
};

export default function WorkLogTable({ logs, summary }: WorkLogTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPic, setFilterPic] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");

  // Extract unique PIC names and categories
  const picNames = useMemo(() => {
    const names = new Set(logs.map((l) => l.picName));
    return Array.from(names).sort();
  }, [logs]);

  const categories = useMemo(() => {
    const cats = new Set(logs.map((l) => l.category));
    return Array.from(cats).sort();
  }, [logs]);

  // Filter logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (filterPic !== "all" && log.picName !== filterPic) return false;
      if (filterCategory !== "all" && log.category !== filterCategory) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          log.description.toLowerCase().includes(q) ||
          log.picName.toLowerCase().includes(q) ||
          log.category.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [logs, filterPic, filterCategory, searchQuery]);

  // Group filtered logs by date for display
  const groupedByDate = useMemo(() => {
    const groups: Record<string, WorkLog[]> = {};
    for (const log of filteredLogs) {
      if (!groups[log.date]) groups[log.date] = [];
      groups[log.date].push(log);
    }
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
  }, [filteredLogs]);

  // Summary for filtered view
  const filteredSummaryByPic = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const log of filteredLogs) {
      counts[log.picName] = (counts[log.picName] ?? 0) + 1;
    }
    return Object.entries(counts).sort(([, a], [, b]) => b - a);
  }, [filteredLogs]);

  const filteredSummaryByCategory = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const log of filteredLogs) {
      counts[log.category] = (counts[log.category] ?? 0) + 1;
    }
    return Object.entries(counts).sort(([, a], [, b]) => b - a);
  }, [filteredLogs]);

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Entries
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-foreground">
                {summary.totalLogs}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active PIC
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-foreground">
                {Object.keys(summary.byPic).length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Categories
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-foreground">
                {Object.keys(summary.byCategory).length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Days
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-foreground">
                {Object.keys(summary.byDate).length}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recap per PIC and Category */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              Recap by PIC
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {filteredSummaryByPic.map(([name, count]) => (
              <div
                key={name}
                className="flex items-center justify-between py-1.5 px-2 rounded-md bg-muted/50"
              >
                <span className="text-sm font-medium truncate">{name}</span>
                <Badge variant="secondary" className="text-xs font-mono shrink-0">
                  {count} entries
                </Badge>
              </div>
            ))}
            {filteredSummaryByPic.length === 0 && (
              <p className="text-sm text-muted-foreground">No data</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Tag className="w-4 h-4 text-primary" />
              Recap by Category
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {filteredSummaryByCategory.map(([cat, count]) => (
              <div
                key={cat}
                className="flex items-center justify-between py-1.5 px-2 rounded-md bg-muted/50"
              >
                <span className="text-sm font-medium truncate">{cat}</span>
                <Badge variant="secondary" className="text-xs font-mono shrink-0">
                  {count} entries
                </Badge>
              </div>
            ))}
            {filteredSummaryByCategory.length === 0 && (
              <p className="text-sm text-muted-foreground">No data</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search description, PIC, or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterPic} onValueChange={setFilterPic}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Filter by PIC" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All PIC</SelectItem>
            {picNames.map((name) => (
              <SelectItem key={name} value={name}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-full sm:w-[220px]">
            <Tag className="w-4 h-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Filter by Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Results count */}
      <p className="text-xs text-muted-foreground">
        Showing {filteredLogs.length} of {logs.length} entries
      </p>

      {/* Grouped log entries */}
      {groupedByDate.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-10 h-10 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground text-sm">No matching log entries</p>
        </div>
      ) : (
        <div className="space-y-4">
          {groupedByDate.map(([date, dateLogs]) => (
            <div key={date}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <h3 className="text-sm font-semibold text-foreground">
                  {format(new Date(date + "T00:00:00"), "EEEE, MMMM d, yyyy")}
                </h3>
                <Badge variant="secondary" className="text-[10px] font-mono">
                  {dateLogs.length} entries
                </Badge>
              </div>
              <div className="ml-3 border-l-2 border-border pl-4 space-y-2">
                {dateLogs.map((log) => (
                  <div
                    key={log._id}
                    className="bg-card border border-border rounded-lg p-3 hover:border-primary/30 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center">
                          {log.picName.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-foreground">
                          {log.picName}
                        </span>
                      </div>
                      <Badge
                        variant="secondary"
                        className="text-[10px] w-fit shrink-0"
                      >
                        {log.category}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                      {log.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
