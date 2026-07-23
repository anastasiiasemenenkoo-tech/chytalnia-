import { Target } from "lucide-react";

import { EditYearlyGoalDialog } from "@/components/dashboard/edit-yearly-goal-dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getDictionary } from "@/i18n";
import { interpolate } from "@/i18n/interpolate";

export async function YearlyGoalCard({
  goal,
  readThisYear,
  year,
}: {
  goal: number | null;
  readThisYear: number;
  year: number;
}) {
  const dict = await getDictionary();
  const cardLabel = interpolate(dict.goal.cardLabel, { year });

  if (goal == null) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardDescription className="inline-flex items-center gap-1">
            <Target className="h-3.5 w-3.5" />
            {cardLabel}
          </CardDescription>
          <CardTitle className="text-3xl">—</CardTitle>
        </CardHeader>
        <CardContent>
          <EditYearlyGoalDialog currentGoal={null} />
        </CardContent>
      </Card>
    );
  }

  const pct = Math.min(
    100,
    Math.round((readThisYear / Math.max(goal, 1)) * 100),
  );

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription className="inline-flex items-center gap-1">
          <Target className="h-3.5 w-3.5" />
          {cardLabel}
        </CardDescription>
        <CardTitle className="text-3xl">
          {readThisYear}
          <span className="text-muted-foreground text-lg font-normal">
            {interpolate(dict.goal.suffix, { target: goal })}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Progress value={pct} className="h-1.5" />
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-xs">
            {interpolate(dict.goal.progress, {
              pct,
              left: Math.max(goal - readThisYear, 0),
            })}
          </p>
          <EditYearlyGoalDialog currentGoal={goal} />
        </div>
      </CardContent>
    </Card>
  );
}
