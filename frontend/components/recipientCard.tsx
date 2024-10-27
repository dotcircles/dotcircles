import { Card, CardFooter, CardHeader } from "@nextui-org/card";
import { Image } from "@nextui-org/image";

export default function Recipient({ recipient, imageUrl, title }: any) {
  return (
    <Card isFooterBlurred radius="lg" className="border-none">
      <CardHeader className="pb-0 pt-2 px-4 flex-col items-start">
        <h4 className="font-bold text-large">{title}</h4>
      </CardHeader>
      <Image
        alt="Person"
        className="object-cover"
        height={200}
        src={imageUrl}
        width={200}
      />
      <CardFooter className="text-center before:bg-slate/10 border-slate/20 border-1 overflow-hidden py-1 absolute before:rounded-xl rounded-large bottom-1 w-[calc(100%_-_8px)] shadow-small ml-1 z-10">
        <p className="text-center text-white/80">{recipient}</p>
      </CardFooter>
    </Card>
  );
}
