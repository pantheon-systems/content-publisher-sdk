import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

function SkeletonCard() {
  return (
    <div className="overflow-clip rounded-xl shadow-lg ring-1 ring-gray-300/50">
      <Skeleton height={196} borderRadius={0} />
      <div className="p-8">
        <Skeleton height={28} width="70%" />
        <Skeleton count={2} className="mt-3" />
        <Skeleton height={40} width={100} className="mt-8" />
      </div>
    </div>
  );
}

export function SkeletonArticleList({
  headerText,
  cardCount = 6,
}: {
  headerText?: string;
  cardCount?: number;
}) {
  return (
    <section className="max-w-screen-3xl mx-auto px-4 pt-16 sm:w-4/5 md:w-3/4 lg:w-4/5 2xl:w-3/4">
      {headerText ? (
        <header className="mb-8">
          <h1 className="text-5xl font-bold">{headerText}</h1>
        </header>
      ) : (
        <div className="mb-8">
          <Skeleton height={48} width="30%" />
        </div>
      )}
      <div className="grid grid-cols-1 gap-8 pb-4 lg:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: cardCount }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </section>
  );
}

export function SkeletonHomepageGrid() {
  return (
    <section className="max-w-screen-3xl mx-auto mt-32 flex justify-center px-4 sm:px-6 lg:px-0">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:w-2/3 2xl:w-full 2xl:grid-cols-[repeat(auto-fit,minmax(300px,438px))] 2xl:justify-center">
        {[0, 1, 2].map((i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </section>
  );
}
