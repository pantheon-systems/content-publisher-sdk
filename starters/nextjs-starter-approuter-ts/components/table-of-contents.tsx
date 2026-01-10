import { TabTree } from "@pantheon-systems/cpub-react-sdk";
import clsx from "clsx";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import ChevronRight from "./../assets/icons/chevron-right.svg";

const NavigationOption = ({
  tabTree,
  activeTab,
}: {
  tabTree: TabTree<unknown>;
  activeTab: string | null | undefined;
}) => {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(true);
  const params = useMemo(() => {
    if (typeof window === "undefined") return null;

    const params = new URLSearchParams(window.location.search);
    params.set("tabId", tabTree.tabProperties?.tabId || "");
    return params;
  }, [tabTree]);

  const href = useMemo(() => {
    return params ? `${pathname}?${params.toString()}` : "#";
  }, [pathname, params]);

  return (
    <div
      style={{
        marginLeft: (tabTree.tabProperties?.nestingLevel || 0) * 18,
      }}
    >
      <div
        className={clsx("flex flex-row items-center px-[10px] py-[8px]", {
          "rounded-md bg-neutral-200":
            activeTab === tabTree.tabProperties?.tabId,
        })}
      >
        <a
          href={href}
          onClick={(e) => {
            if (!params) {
              return;
            }

            e.preventDefault();
            window.history.replaceState(null, "", href);
          }}
          className={clsx(
            "flex-1 no-underline decoration-neutral-800 hover:underline",
            {
              "decoration-neutral-900":
                tabTree.tabProperties?.parentTabId == null,
            },
          )}
        >
          <div
            className={clsx("", {
              "font-bold text-neutral-900":
                tabTree.tabProperties?.parentTabId == null,
              "font-thin text-neutral-800":
                tabTree.tabProperties?.parentTabId != null,
            })}
          >
            {tabTree.tabProperties?.title}
          </div>
        </a>
        {tabTree.childTabs?.length ? (
          <div
            onClick={() => {
              setIsOpen(!isOpen);
            }}
            tabIndex={0}
            aria-label={`Show children nested under tab ${tabTree.tabProperties?.title}`}
          >
            <Image
              src={ChevronRight}
              alt="Next"
              title="Next"
              width={11}
              height={16}
              className={clsx("my-0 cursor-pointer select-none", {
                "rotate-90": isOpen,
              })}
            />
          </div>
        ) : null}
      </div>
      {tabTree.childTabs?.length && isOpen ? (
        <div className="my-[8px] ml-[10px] border-l-[1px] border-neutral-200">
          {tabTree.childTabs?.map((x, i) => (
            <NavigationOption
              key={x.tabProperties?.tabId || i}
              tabTree={x}
              activeTab={activeTab}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
};

export const TableOfContents = ({
  tabTree,
  activeTab,
}: {
  tabTree: TabTree<unknown>[];
  activeTab: string | null | undefined;
}) => {
  return (
    <div className="mt-1">
      <div className="mb-2 font-semibold text-neutral-500">
        TABLE OF CONTENTS
      </div>
      {tabTree.map((x, i) => (
        <NavigationOption
          key={x.tabProperties?.tabId || i}
          tabTree={x}
          activeTab={activeTab}
        />
      ))}
    </div>
  );
};
