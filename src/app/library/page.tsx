import {
  PublicMaterialGallery,
  type PublicLibraryFilter,
} from "@/components/teacher/public-material-gallery";
import { loadPublishedAssignmentList } from "@/app/teacher/assignment-list-loader";

export const dynamic = "force-dynamic";

type LibraryPageProps = {
  searchParams: Promise<{
    filter?: string | string[];
  }>;
};

const publicLibraryFilters = new Set<PublicLibraryFilter>([
  "all",
  "preview",
  "active",
]);

function firstSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function parseFilter(value: string | string[] | undefined): PublicLibraryFilter {
  const filter = firstSearchParam(value);

  return filter && publicLibraryFilters.has(filter as PublicLibraryFilter)
    ? (filter as PublicLibraryFilter)
    : "all";
}

export default async function LibraryPage({ searchParams }: LibraryPageProps) {
  const params = await searchParams;
  const activeFilter = parseFilter(params.filter);
  const { assignments, loadError } = await loadPublishedAssignmentList();

  return (
    <PublicMaterialGallery
      activeFilter={activeFilter}
      assignments={assignments}
      loadError={loadError}
    />
  );
}
