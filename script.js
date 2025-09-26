const DEFAULT_BALANCE = 10000;
const STOCKS_DEF = [
  {symbol:"BIM",name:"BIM Birleşik",price:120},
  {symbol:"SOK",name:"ŞOK Market",price:95},
  {symbol:"A101",name:"A101 Market",price:85},
  {symbol:"TUSAS",name:"TUSAŞ",price:170},
  {symbol:"ASELS",name:"ASELSAN",price:260},
  {symbol:"APPLE",name:"APPLE",price:180},
  {symbol:"INTEL",name:"INTEL",price:140},
  {symbol:"ALTIN",name:"ALTIN",price:2000}
];

let balance = DEFAULT_BALANCE;
let holdings = {};
let history = {};
let prices = {};

// HTML ELEMENTLERİ
const el = {
  balance: document.getElementById("balance"),
  stocksGrid: document.getElementById("stocks"),
  portfolio: document.getElementById("portfolio"),
  history: document.getElementById("history"),
  tradePanel: document.getElementById("tradePanel"),
  tradeSymbol: document.getElementById("tradeSymbol"),
  tradePrice: document.getElementById("tradePrice"),
  tradeQty: document.getElementById("tradeQty"),
  buyBtn: document.getElementById("buyBtn"),
  sellBtn: document.getElementById("sellBtn"),
  closeTrade: document.getElementById("closeTrade")
};

// INITIALIZE
STOCKS_DEF.forEach(s=>{
  prices[s.symbol] = {price:s.price, history:Array(30).fill(s.price)};
});
renderAll();
startMarketLoop();

// FONKSİYONLAR
function renderAll(){renderMarket();renderPortfolio();renderHistory();updateBalanceDisplay();}
function updateBalanceDisplay(){el.balance.innerText=balance.toLocaleString("tr-TR",{style:"currency",currency:"TRY"})}
function renderMarket(){
  el.stocksGrid.innerHTML="";
  const template = document.getElementById("stock-template");
  STOCKS_DEF.forEach(s=>{
    const clone = template.content.cloneNode(true);
    const root = clone.querySelector(".stock");
    const sym = root.querySelector(".symbol");
    const name = root.querySelector(".name");
    const priceEl = root.querySelector(".price");
    const chgEl = root.querySelector(".chg");
    const spark = root.querySelector(".spark");

    sym.innerText=s.symbol;
    name.innerText=s.name;
    const p = prices[s.symbol].price;
    priceEl.innerText=p.toFixed(2)+" ₺";

    const hist = prices[s.symbol].history;
    const prev = hist[hist.length-2]??hist[hist.length-1];
    const pct = ((p-prev)/prev)*100;
    chgEl.innerText=(pct>=0?"+":"")+pct.toFixed(2)+"%";
    chgEl.className='chg '+(pct>=0?'up':'down');
    drawSpark(spark,hist);

    root.addEventListener("click",()=>{
      openTradePanel(s.symbol);
    });

    el.stocksGrid.appendChild(clone);
  });
}

function drawSpark(canvas,arr){
  const ctx=canvas.getContext("2d");
  const w=canvas.width,h=canvas.height;
  ctx.clearRect(0,0,w,h);
  const min=Math.min(...arr),max=Math.max(...arr),range=max-min||1;
  ctx.lineWidth=2;
  const grad=ctx.createLinearGradient(0,0,w,0);
  grad.addColorStop(0,"#8be9fd");grad.addColorStop(1,"#7ef3b1");
  ctx.strokeStyle=grad;
  ctx.beginPath();
  arr.forEach((v,i)=>{
    const x=(i/(arr.length-1))*(w-6)+3;
    const y=h-((v-min)/range)*(h-6)-3;
    i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
  });
  ctx.stroke();
}

function startMarketLoop(){
  setInterval(()=>{
    STOCKS_DEF.forEach(s=>{
      let last=prices[s.symbol].price;
      const rnd=(Math.random()*2-1)*1.2;
      const newPrice=Math.max(0.1,last*(1+rnd/100));
      prices[s.symbol].price = Number(newPrice.toFixed(2));
      prices[s.symbol].history.push(prices[s.symbol].price);
      if(prices[s.symbol].history.length>60)prices[s.symbol].history.shift();
    });
    renderAll();
  },2000);
}

function renderPortfolio(){
  el.portfolio.innerHTML="";
  for(let sym in holdings){
    const div=document.createElement("div");
    div.className="port-item";
    div.innerHTML=`<div>${sym} • ${holdings[sym]} adet</div><div>${(holdings[sym]*prices[sym].price).toFixed(2)} ₺</div>`;
    el.portfolio.appendChild(div);
  }
}

function renderHistory(){
  el.history.innerHTML="";
  if(!history.log) return;
  history.log.forEach(h=>{
    const div=document.createElement("div");
    div.className="hist-row";
    div.innerText=`${h.type} ${h.sym} • ${h.qty} adet @ ${h.price.toFixed(2)} ₺`;
    el.history.appendChild(div);
  });
}

function openTradePanel(sym){
  el.tradePanel.classList.remove("hidden");
  el.tradeSymbol.innerText=sym;
  el.tradePrice.innerText=prices[sym].price.toFixed(2);
  el.tradeQty.value=1;

  el.buyBtn.onclick=()=>trade("buy",sym);
  el.sellBtn.onclick=()=>trade("sell",sym);
}

el.closeTrade.addEventListener("click",()=>el.tradePanel.classList.add("hidden"));

function trade(type,sym){
  const qty=Math.max(1,Math.floor(Number(el.tradeQty.value)||1));
  const price=prices[sym].price;
  if(type==="buy"){
    if(qty*price>balance){alert("Yetersiz bakiye!");return;}
    balance-=qty*price;
    holdings[sym]=(holdings[sym]||0)+qty;
  }else{
    if(!holdings[sym]||holdings[sym]<qty){alert("Yeterli hisse yok!");return;}
    holdings[sym]-=qty;
    if(holdings[sym]===0)delete holdings[sym];
    balance+=qty*price;
  }
  if(!history.log)history.log=[];
  history.log.unshift({type,sym,qty,price});
  if(history.log.length>200)history.log.length=200;
  el.tradePanel.classList.add("hidden");
  renderAll();
}
