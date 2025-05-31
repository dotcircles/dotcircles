'use client'

import { Button } from "@heroui/button";
import { Link } from "@heroui/link";
import { addToast } from "@heroui/toast";
// import { WalletConnectButton } from "./components/ui/WalletConnect";

export default function HomePage() {
  return (
    <main className="flex flex-col items-center justify-center py-20 px-4 text-center">

      <h1 className="text-4xl font-bold mb-4">
        Welcome to DotCircles
      </h1>

      <p className="text-lg text-default-500 max-w-xl mb-8">
        Transparent savings circles powered by blockchain. Save together. Earn together.
      </p>

      <div className="flex gap-4 flex-wrap justify-center">

        {/* <WalletConnectButton /> */}

        <Button as={Link} href="/dashboard" color="primary" radius="full">
          Go to Dashboard
        </Button>

        <Button as={Link} href="/dashboard/create" variant="bordered" radius="full">
          Create a Circle
        </Button>
      </div>

    </main>
  );
}
