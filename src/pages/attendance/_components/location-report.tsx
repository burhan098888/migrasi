import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty.tsx";
import { MapPin, Navigation, Clock, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { useDemoMode } from "@/hooks/use-demo-mode.tsx";
import { useState } from "react";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import AttendanceMap from "./attendance-map.tsx";

type LocationReportProps = {
  startDate: string;
  endDate: string;
};

export default function LocationReport({ startDate, endDate }: LocationReportProps) {
  const { demoModeArg } = useDemoMode();
  const [selectedUser, setSelectedUser] = useState<string>("all");

  const userIdArg: Id<"users"> | undefined =
    selectedUser !== "all" ? (selectedUser as Id<"users">) : undefined;

  const records = useQuery(api.attendance.getLocationReport, {
    startDate,
    endDate,
    userId: userIdArg,
    demoMode: demoModeArg,
  });

  // Get users for filter
  const users = useQuery(api.users.listAll, { demoMode: demoModeArg });

  const isLoading = records === undefined;
  const totalCheckIns = records?.length ?? 0;
  const totalCheckOuts = records?.filter((r) => r.checkOutLat && r.checkOutLng).length ?? 0;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Navigation className="w-4 h-4 text-muted-foreground" />
          <Select value={selectedUser} onValueChange={setSelectedUser}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All staff" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Staff</SelectItem>
              {users?.map((u) => (
                <SelectItem key={u._id} value={u._id}>
                  {u.name ?? u.email ?? "Unknown"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 ml-auto text-sm">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-green-500" />
            Check-in
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500" />
            Check-out
          </span>
        </div>
      </div>

      {/* Summary badges */}
      {!isLoading && records.length > 0 && (
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20">
            <MapPin className="w-3.5 h-3.5 mr-1" />
            {totalCheckIns} Check-in locations
          </Badge>
          <Badge variant="secondary" className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20">
            <MapPin className="w-3.5 h-3.5 mr-1" />
            {totalCheckOuts} Check-out locations
          </Badge>
        </div>
      )}

      {/* Map */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPin className="w-5 h-5 text-primary" />
            Location Map
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[450px] w-full rounded-lg" />
          ) : records.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <MapPin />
                </EmptyMedia>
                <EmptyTitle>No location data</EmptyTitle>
                <EmptyDescription>
                  Attendance location records for this period will appear here
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <AttendanceMap records={records} />
          )}
        </CardContent>
      </Card>

      {/* Detail table */}
      {!isLoading && records.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Location Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2 font-medium text-muted-foreground">Staff</th>
                    <th className="text-left py-2 px-2 font-medium text-muted-foreground">Date</th>
                    <th className="text-left py-2 px-2 font-medium text-muted-foreground">Check-in</th>
                    <th className="text-left py-2 px-2 font-medium text-muted-foreground">Check-in Location</th>
                    <th className="text-left py-2 px-2 font-medium text-muted-foreground">Check-out</th>
                    <th className="text-left py-2 px-2 font-medium text-muted-foreground">Check-out Location</th>
                    <th className="text-left py-2 px-2 font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record) => (
                    <tr key={record._id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="py-2.5 px-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-semibold shrink-0">
                            {record.userName.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium truncate max-w-[120px]">{record.userName}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-2 whitespace-nowrap text-muted-foreground">
                        {format(new Date(record.date + "T00:00:00"), "d MMM yyyy")}
                      </td>
                      <td className="py-2.5 px-2 whitespace-nowrap">
                        <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                          <Clock className="w-3 h-3" />
                          {format(new Date(record.checkInTime), "hh:mm a")}
                        </span>
                      </td>
                      <td className="py-2.5 px-2">
                        <a
                          href={`https://www.google.com/maps?q=${record.checkInLat},${record.checkInLng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline flex items-center gap-1"
                        >
                          <MapPin className="w-3 h-3" />
                          {record.checkInLat.toFixed(5)}, {record.checkInLng.toFixed(5)}
                        </a>
                      </td>
                      <td className="py-2.5 px-2 whitespace-nowrap">
                        {record.checkOutTime ? (
                          <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                            <Clock className="w-3 h-3" />
                            {format(new Date(record.checkOutTime), "hh:mm a")}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </td>
                      <td className="py-2.5 px-2">
                        {record.checkOutLat && record.checkOutLng ? (
                          <a
                            href={`https://www.google.com/maps?q=${record.checkOutLat},${record.checkOutLng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline flex items-center gap-1"
                          >
                            <MapPin className="w-3 h-3" />
                            {record.checkOutLat.toFixed(5)}, {record.checkOutLng.toFixed(5)}
                          </a>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </td>
                      <td className="py-2.5 px-2">
                        <Badge
                          variant={record.status === "checked_out" ? "default" : "secondary"}
                          className={
                            record.status === "checked_out"
                              ? "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20"
                              : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                          }
                        >
                          {record.status === "checked_out" ? (
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                          ) : (
                            <Clock className="w-3 h-3 mr-1" />
                          )}
                          {record.status === "checked_out" ? "Done" : "Active"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
