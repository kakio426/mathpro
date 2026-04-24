import { Container } from "@/components/layout/container";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function TeacherAssignmentListLoading() {
  return (
    <main className="py-6 sm:py-8">
      <Container className="max-w-[1400px] space-y-6">
        <section className="rounded-[2rem] border border-border bg-[#12312e] p-5 text-white shadow-soft sm:p-7">
          <div className="h-6 w-32 animate-pulse rounded-full bg-white/20" />
          <div className="mt-5 h-11 max-w-2xl animate-pulse rounded-2xl bg-white/20" />
          <div className="mt-4 h-5 max-w-xl animate-pulse rounded-full bg-white/15" />
        </section>
        <section className="grid gap-4">
          {[0, 1, 2].map((index) => (
            <Card className="rounded-[1.75rem]" key={index}>
              <CardHeader className="space-y-4">
                <div className="h-5 w-40 animate-pulse rounded-full bg-secondary" />
                <div className="h-8 max-w-lg animate-pulse rounded-2xl bg-secondary" />
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-3">
                <div className="h-16 animate-pulse rounded-2xl bg-secondary" />
                <div className="h-16 animate-pulse rounded-2xl bg-secondary" />
                <div className="h-16 animate-pulse rounded-2xl bg-secondary" />
              </CardContent>
            </Card>
          ))}
        </section>
      </Container>
    </main>
  );
}
