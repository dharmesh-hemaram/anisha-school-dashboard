import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import QuizPanel from "./QuizPanel";

const TABLE_NUMBERS = Array.from({ length: 20 }, (_, i) => i + 1);
const MULTIPLIERS = Array.from({ length: 10 }, (_, i) => i + 1);

export default function TablesPage() {
  return (
    <>
      <Tabs defaultValue="chart" className="w-full flex-1">
        <TabsList variant="line">
          <TabsTrigger value="chart">Chart</TabsTrigger>
          <TabsTrigger value="quiz">Quiz</TabsTrigger>
        </TabsList>

        <TabsContent value="chart">
          {/* All 20 at once in a grid, not one table behind a picker -- this
              is a reference chart to scan or print, not a thing you look up
              one value of, so a wide screen should show as many tables side
              by side as fit instead of sitting mostly empty next to a single
              card. Columns auto-fill at a fixed size (not 1fr) so a card
              never stretches wider than its content on a big screen --
              otherwise "N × M" and its answer end up pushed to opposite
              edges of a half-empty row. */}
          <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,200px))] gap-3">
            {TABLE_NUMBERS.map((n) => (
              <Card key={n} size="sm" className="gap-2">
                <CardHeader>
                  <CardTitle>Table of {n}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-1 text-sm">
                  {MULTIPLIERS.map((m) => (
                    <div key={m} className="flex items-baseline justify-between gap-2 tabular-nums">
                      <span className="text-muted-foreground">
                        {n} × {m}
                      </span>
                      <span className="font-medium">= {n * m}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="quiz">
          <QuizPanel />
        </TabsContent>
      </Tabs>
    </>
  );
}
