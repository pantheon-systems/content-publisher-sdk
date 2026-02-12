import Head from "next/head";
import { generateNextSeo } from "next-seo/pages";
import Image from "next/image";
import Link from "next/link";
import Layout from "../components/layout";
import { Button } from "../components/ui/button";

export default function Custom404() {
  return (
    <Layout>
      <Head>
        {generateNextSeo({
          title: "Page not found",
          description:
            "The page might not exist or is temporarily unavailable. Check the URL or return to homepage.",
        })}
      </Head>

      <div className="max-w-screen-3xl 3xl:px-12 mx-auto flex flex-col py-0 xl:flex-row xl:items-center xl:gap-[139px]">
        <div className="mx-auto mb-32 mt-24 px-6 sm:max-w-[600px] md:mx-0 md:ml-24 xl:mb-0 xl:ml-32 xl:mt-0 xl:max-w-max xl:py-0 xl:pl-0">
          <div>
            <h1 className="text-5xl font-bold leading-[3.39rem]">404</h1>
            <h2 className="mt-3 text-5xl font-bold leading-[3.39rem]">
              Page not found
            </h2>
            <p className="mt-3 text-xl leading-[1.875rem]">
              The page might not exist or is temporarily unavailable. Check the
              URL or return to homepage.
            </p>
          </div>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="https://pcc.pantheon.io/docs">
              <Button size="large">Go to Documentation</Button>
            </Link>
            <Link href="https://pantheon.io/support">
              <Button variant="secondary" size="large">
                Contact support
              </Button>
            </Link>
          </div>
        </div>
        <div className="relative h-[490px] w-full sm:h-[640px] xl:max-w-[900px]">
          <Image
            src="/images/error.png"
            alt="Pantheon Logo"
            fill
            className="object-contain grayscale"
          />
        </div>
      </div>
    </Layout>
  );
}
