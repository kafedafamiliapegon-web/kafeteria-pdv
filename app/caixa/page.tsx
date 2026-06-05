"use client";

import { useEffect, useState } from "react";
import Header from "../../components/Header";
import { supabase } from "../../lib/supabase";

export default function Caixa() {

const[
vendas,
setVendas
]=
useState<any[]>([]);

const[
resumo,
setResumo
]=
useState({

pix:0,

cartao:0,

dinheiro:0,

total:0

});

async function carregar(){

const{
data
}=

await supabase

.from(
"sales"
)

.select("*")

.order(
"created_at",
{
ascending:false
}
);

const lista=
data||[];

setVendas(
lista
);

let pix=0;

let cartao=0;

let dinheiro=0;

lista.forEach(

v=>{

const valor=
Number(
v.total
);

if(
v.payment_method==="PIX"
)

pix+=valor;

if(
v.payment_method==="Cartão"
)

cartao+=valor;

if(
v.payment_method==="Dinheiro"
)

dinheiro+=valor;

}

);

setResumo({

pix,

cartao,

dinheiro,

total:
pix+
cartao+
dinheiro

});

}

useEffect(
()=>{
carregar();
},
[]
);

return(

<main
className="
min-h-screen
bg-[#07130d]
text-white
p-8
"
>

<Header
title="💰 Caixa"
/>

<div
className="
grid
gap-5
md:grid-cols-2
xl:grid-cols-4
"
>

<div
className="
rounded-3xl
bg-[#103520]
p-8
"
>

<div
className="
text-4xl
"
>

🟢

</div>

<h2
className="
mt-5
text-xl
"
>

PIX

</h2>

<div
className="
mt-4
text-4xl
font-bold
"
>

R$

{
resumo.pix.toFixed(
2
)
}

</div>

</div>

<div
className="
rounded-3xl
bg-[#103520]
p-8
"
>

<div
className="
text-4xl
"
>

💳

</div>

<h2
className="
mt-5
text-xl
"
>

Cartão

</h2>

<div
className="
mt-4
text-4xl
font-bold
"
>

R$

{
resumo.cartao.toFixed(
2
)
}

</div>

</div>

<div
className="
rounded-3xl
bg-[#103520]
p-8
"
>

<div
className="
text-4xl
"
>

💵

</div>

<h2
className="
mt-5
text-xl
"
>

Dinheiro

</h2>

<div
className="
mt-4
text-4xl
font-bold
"
>

R$

{
resumo.dinheiro.toFixed(
2
)
}

</div>

</div>

<div
className="
rounded-3xl
bg-green-700
p-8
"
>

<div
className="
text-4xl
"
>

💰

</div>

<h2
className="
mt-5
text-xl
"
>

Total

</h2>

<div
className="
mt-4
text-4xl
font-bold
"
>

R$

{
resumo.total.toFixed(
2
)
}

</div>

</div>

</div>

<div
className="
mt-10
rounded-3xl
bg-[#103520]
p-8
"
>

<h2
className="
mb-6
text-3xl
font-bold
"
>

🧾 Últimas vendas

</h2>

<div
className="
space-y-4
"
>

{

vendas.map(

venda=>(

<div

key={
venda.id
}

className="
flex
justify-between
border-b
border-white/10
pb-4
"

>

<div>

{
venda.payment_method
}

</div>

<div>

R$

{
Number(
venda.total
).toFixed(
2
)
}

</div>

</div>

)

)

}

</div>

</div>

</main>

);

}