import { useState, useCallback } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { ConvexError } from "convex/values";
import { toast } from "sonner";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Spinner } from "@/components/ui/spinner.tsx";
import { useDemoMode } from "@/hooks/use-demo-mode.tsx";
import {
  LogIn,
  LogOut,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
} from "lucide-react";
import { format } from "date-fns";

type GeoState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "denied" }
  | { status: "unsupported" }
  | { status: "error"; message: string };

export default function CheckInOutCard() {
  const { isDemoGuest, demoModeArg } = useDemoMode();
  const todayStatus = useQuery(api.attendance.getTodayStatus, { demoMode: demoModeArg });
  const checkIn = useMutation(api.attendance.checkIn);
  const checkOut = useMutation(api.attendance.checkOut);
  const [geoState, setGeoState] = useState<GeoState>({ status: "idle" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getPosition = useCallback((): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!("geolocation" in navigator)) {
        reject(new Error("unsupported"));
        return;
      }
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      });
    });
  }, []);

  const handleCheckIn = async () => {
    setGeoState({ status: "loading" });
    setIsSubmitting(true);
    try {
      const position = await getPosition();
      await checkIn({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      });
      setGeoState({ status: "idle" });
      toast.success("Checked in successfully!");
    } catch (error) {
      if (error instanceof GeolocationPositionError) {
        if (error.code === error.PERMISSION_DENIED) {
          setGeoState({ status: "denied" });
          toast.error("Location permission denied. Please enable it in your browser settings.");
        } else {
          setGeoState({ status: "error", message: "Could not get your location. Please try again." });
          toast.error("Could not get your location. Please try again.");
        }
      } else if (error instanceof ConvexError) {
        const data = error.data as { message: string };
        toast.error(data.message);
        setGeoState({ status: "idle" });
      } else if (error instanceof Error && error.message === "unsupported") {
        setGeoState({ status: "unsupported" });
        toast.error("Geolocation is not supported on this device.");
      } else {
        setGeoState({ status: "error", message: "An unexpected error occurred." });
        toast.error("An unexpected error occurred.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckOut = async () => {
    setGeoState({ status: "loading" });
    setIsSubmitting(true);
    try {
      const position = await getPosition();
      await checkOut({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      });
      setGeoState({ status: "idle" });
      toast.success("Checked out successfully!");
    } catch (error) {
      if (error instanceof GeolocationPositionError) {
        if (error.code === error.PERMISSION_DENIED) {
          setGeoState({ status: "denied" });
          toast.error("Location permission denied. Please enable it in your browser settings.");
        } else {
          setGeoState({ status: "error", message: "Could not get your location. Please try again." });
          toast.error("Could not get your location. Please try again.");
        }
      } else if (error instanceof ConvexError) {
        const data = error.data as { message: string };
        toast.error(data.message);
        setGeoState({ status: "idle" });
      } else if (error instanceof Error && error.message === "unsupported") {
        setGeoState({ status: "unsupported" });
        toast.error("Geolocation is not supported on this device.");
      } else {
        setGeoState({ status: "error", message: "An unexpected error occurred." });
        toast.error("An unexpected error occurred.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = todayStatus === undefined;

  // Determine current state
  const hasCheckedIn = todayStatus !== null && todayStatus !== undefined;
  const isCheckedIn = hasCheckedIn && todayStatus.status === "checked_in";
  const isCheckedOut = hasCheckedIn && todayStatus.status === "checked_out";

  // Demo guest view-only card
  if (isDemoGuest) {
    return (
      <Card className="relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Today{"'"}s Attendance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-3 py-8">
            <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center">
              <Eye className="w-8 h-8 text-amber-500" />
            </div>
            <p className="text-muted-foreground text-sm text-center">
              Sign in to check in and track your attendance with geolocation
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="relative overflow-hidden">
      {/* Status gradient bar */}
      <div
        className={`absolute top-0 left-0 right-0 h-1 ${
          isCheckedOut
            ? "bg-green-500"
            : isCheckedIn
              ? "bg-amber-500"
              : "bg-muted-foreground/30"
        }`}
      />
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Today{"'"}s Attendance
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Spinner />
          </div>
        ) : (
          <>
            {/* Status display */}
            <div className="flex flex-col items-center gap-3 py-4">
              {!hasCheckedIn && (
                <>
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                    <MapPin className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground text-sm">
                    You have not checked in yet today
                  </p>
                </>
              )}
              {isCheckedIn && (
                <>
                  <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center">
                    <Clock className="w-8 h-8 text-amber-500" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-amber-600 dark:text-amber-400">
                      Checked In
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(todayStatus.checkInTime), "hh:mm a")}
                    </p>
                  </div>
                </>
              )}
              {isCheckedOut && (
                <>
                  <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-green-500" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-green-600 dark:text-green-400">
                      Completed
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(todayStatus.checkInTime), "hh:mm a")}
                      {" — "}
                      {todayStatus.checkOutTime
                        ? format(new Date(todayStatus.checkOutTime), "hh:mm a")
                        : ""}
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Action button */}
            {!hasCheckedIn && (
              <Button
                className="w-full h-14 text-lg gap-2"
                onClick={handleCheckIn}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Spinner />
                ) : (
                  <LogIn className="w-5 h-5" />
                )}
                Check In
              </Button>
            )}
            {isCheckedIn && (
              <Button
                className="w-full h-14 text-lg gap-2"
                variant="destructive"
                onClick={handleCheckOut}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Spinner />
                ) : (
                  <LogOut className="w-5 h-5" />
                )}
                Check Out
              </Button>
            )}
            {isCheckedOut && (
              <div className="flex items-center gap-2 justify-center text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                Attendance completed for today
              </div>
            )}

            {/* Geo state warnings */}
            {geoState.status === "denied" && (
              <div className="flex items-start gap-2 p-3 bg-destructive/10 rounded-lg text-sm text-destructive">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <p>
                  Location access was denied. Please enable it in your browser
                  settings and try again.
                </p>
              </div>
            )}
            {geoState.status === "unsupported" && (
              <div className="flex items-start gap-2 p-3 bg-destructive/10 rounded-lg text-sm text-destructive">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <p>
                  Geolocation is not supported on this device/browser.
                </p>
              </div>
            )}
            {geoState.status === "error" && (
              <div className="flex items-start gap-2 p-3 bg-destructive/10 rounded-lg text-sm text-destructive">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <p>{geoState.message}</p>
              </div>
            )}

            {/* Location info */}
            {hasCheckedIn && (
              <div className="text-xs text-muted-foreground space-y-1 border-t pt-3">
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  Check-in location: {todayStatus.checkInLat.toFixed(5)},{" "}
                  {todayStatus.checkInLng.toFixed(5)}
                </div>
                {todayStatus.checkOutLat !== undefined &&
                  todayStatus.checkOutLng !== undefined && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      Check-out location: {todayStatus.checkOutLat.toFixed(5)},{" "}
                      {todayStatus.checkOutLng.toFixed(5)}
                    </div>
                  )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
