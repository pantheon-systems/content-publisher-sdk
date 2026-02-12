import { PCCConvenienceFunctions } from "@pantheon-systems/cpub-react-sdk";
import Head from "next/head";
import { generateNextSeo } from "next-seo/pages";
import Image from "next/image";
import Link from "next/link";
import { HomepageArticleGrid } from "../components/grid";
import Layout from "../components/layout";
import { Button } from "../components/ui/button";

export default function Home({ articles, site }) {
  return (
    <Layout>
      <Head>
        {generateNextSeo({
          title: "Pantheon Content Publisher Next.js Starter",
          description:
            "A starter kit for building a Next.js site with Pantheon Content Publisher.",
        })}
      </Head>

      <section className="bg-neutral-100">
        <div className="max-w-screen-3xl 3xl:px-12 mx-auto flex flex-col py-0 xl:flex-row xl:items-center xl:gap-[139px]">
          <div className="mx-auto px-6 py-24 sm:max-w-[533px] sm:px-0 lg:mx-0 lg:pl-24 xl:ml-32 xl:max-w-max xl:py-0 xl:pl-0">
            <p>WELCOME</p>
            <h1 className="my-3 text-5xl font-bold">
              Time to make this site your own.
            </h1>
            <p>
              Your new website is waiting to be built for something amazing.
              <br />
              What are you waiting for?
            </p>
            <div className="mt-8 flex flex-wrap gap-4 xl:flex-col 2xl:flex-row">
              <Link href="/examples">
                <Button size="large" className="w-fit">
                  Discover examples
                </Button>
              </Link>
              <a href="https://pcc.pantheon.io/docs">
                <Button size="large" className="w-fit" variant="secondary">
                  Read our Docs
                </Button>
              </a>
            </div>
          </div>
          <div className="relative h-[490px] w-full sm:h-[640px] xl:max-w-[900px]">
            <Image
              src="/images/globe.png"
              alt="Image of the earth at night illuminated by lights on the ground"
              fill
              className="object-cover"
            />
          </div>
        </div>
      </section>

      <section className="max-w-screen-3xl mx-auto mt-32 flex justify-center px-4 sm:px-6 lg:px-0">
        <HomepageArticleGrid articles={articles} site={site} />
      </section>
    </Layout>
  );
}

export async function getServerSideProps() {
  // Fetch the articles and site in parallel
  const [{ data: articles }, site] = await Promise.all([
    PCCConvenienceFunctions.getPaginatedArticles({
      pageSize: 3,
    }),
    PCCConvenienceFunctions.getSite(),
  ]);

  return {
    props: {
      articles,
      site,
    },
  };
}
