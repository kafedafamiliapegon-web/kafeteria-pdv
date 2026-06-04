"use client";

import {
useEffect,
useState
}
from "react";

import {
useParams
}
from "next/navigation";

import {
supabase
}
from "../../../lib/supabase";

export default function Comanda(){

const{
id
}=useParams();

const[
mesa,
setMesa
]=
useState<any>();

const[
produtos,
setProdutos
]=
useState<any[]>([]);

const[
itens,
setItens
]=
useState<any[]>([]);

async function carregar(){

const{
data:mesaData
}=

await supabase

.from(
"tables_open"
)

.select("*")

.eq(
"id",
id
)

.single();

setMesa(
mesaData
);

const{
data
}=

await supabase

.from(
"products"
)

.select("*");

setProdutos(
data||[]
);

}

function adicionar(
produto:any
){

setItens(

atual=>

[

...atual,

produto

]

);

}

const total=

itens.reduce(

(
soma,
item
)=>

soma+

Number(
item.price
),

0

);

useEffect(

()=>{

if(
id
)

carregar();

},

[
id
]

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

<h1
className="
text-5xl
font-bold
"
>

🪑

{
mesa?.name
}

</h1>

<p
className="
mt-2
text-green-300
"
>

Comanda aberta

</p>

<div
className="
mt-10
grid
gap-8
xl:grid-cols-[1fr_380px]
"
>

<section>

<h2
className="
text-3xl
font-bold
mb-6
"
>

Produtos

</h2>

<div
className="
grid
gap-5
md:grid-cols-2
xl:grid-cols-3
"
>

{

produtos.map(

item=>(

<div

key={
item.id
}

onClick={

()=>

adicionar(
item
)

}

className="
cursor-pointer
rounded-3xl
bg-[#103520]
p-5
hover:scale-[1.02]
transition
"

>

{

item.image_url

?

<img

src={
item.image_url
}

className="
h-48
w-full
rounded-2xl
object-cover
"

/>

:

<div
className="
text-6xl
"
>

☕

</div>

}

<h2
className="
mt-4
text-2xl
font-bold
"
>

{
item.name
}

</h2>

<p>

R$

{
item.price
}

</p>

</div>

)

)

}

</div>

</section>

<aside
className="
rounded-3xl
bg-[#103520]
p-6
h-fit
sticky
top-10
"
>

<h2
className="
text-3xl
font-bold
"
>

🛒 Pedido

</h2>

<div
className="
mt-6
space-y-3
"
>

{

itens.map(

(
item,
i
)=>(

<div

key={
i
}

className="
rounded-xl
bg-black/10
p-4
"

>

{
item.name
}

—

R$

{
item.price
}

</div>

)

)

}

</div>

<div
className="
mt-8
border-t
border-white/10
pt-6
"
>

<div
className="
flex
justify-between
text-3xl
font-bold
text-green-300
"
>

<span>

Total

</span>

<span>

R$

{
total
}

</span>

</div>

<button
className="
mt-6
w-full
rounded-2xl
bg-green-600
py-5
"
>

Finalizar Venda

</button>

</div>

</aside>

</div>

</main>

);

}