"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function TeamRosterPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Roster</CardTitle>
        <CardDescription>
          View and manage player assignments for each team.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p>Team roster content will be displayed here.</p>
      </CardContent>
    </Card>
  );
}
