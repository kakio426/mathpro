import type { ReactNode } from "react";
import { Container } from "@/components/layout/container";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

type RouteShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  routeValue: string;
  highlights: readonly string[];
  footer: ReactNode;
};

export function RouteShell({
  eyebrow,
  title,
  description,
  routeValue,
  highlights,
  footer,
}: RouteShellProps) {
  return (
    <section className="py-[var(--space-section)]">
      <Container className="space-y-6">
        <div className="space-y-4">
          <Badge>{eyebrow}</Badge>
          <div className="space-y-3">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              {title}
            </h1>
            <p className="max-w-2xl text-base leading-7 text-muted">{description}</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>현재 라우트 매개변수</CardTitle>
            <CardDescription>
              실제 세션 데이터 대신 동적 세그먼트가 정상적으로 연결되어 있는지만 보여줍니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-lg border border-border bg-white/80 px-4 py-3 font-mono text-sm text-foreground">
              {routeValue}
            </div>
            <div data-shell-grid="two">
              {highlights.map((highlight) => (
                <div
                  key={highlight}
                  className="rounded-lg border border-border bg-white/75 px-4 py-4 text-sm leading-6 text-muted"
                >
                  {highlight}
                </div>
              ))}
            </div>
            <Separator />
            <div className="text-sm leading-6 text-muted">{footer}</div>
          </CardContent>
        </Card>
      </Container>
    </section>
  );
}
