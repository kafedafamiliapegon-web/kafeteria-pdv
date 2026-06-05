"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

type HeaderProps = {
  title: string;
  backTo?: string;
};

export default function Header({
  title,
  backTo,
}: HeaderProps) {

const router=
useRouter();

return(

<div
className="
mb-10
flex
items-center
justify-between
gap-4
"
>

<div>

<h1
className="
text-5xl
font-bold
"
>

{
title
}

</h1>

<p
className="
mt-3
text-green-100/60
"
>

Kafeteria PDV

</p>

</div>

{

backTo

?

<Link

href={
backTo
}

className="
rounded-2xl
bg-[#103520]
px-6
py-4
font-bold
hover:bg-green-700
"

>

← Voltar

</Link>

:

<button

onClick={
()=>router.back()
}

className="
rounded-2xl
bg-[#103520]
px-6
py-4
font-bold
hover:bg-green-700
"

>

← Voltar

</button>

}

</div>

);

}