'use strict';

const $ = (selector) => document.querySelector(selector);
let demo;
let currentStage = -1;
let isPlaying = false;
let timer;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function safe(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
}

function render() {
  const started = currentStage >= 0;
  const stage = started ? demo.stages[currentStage] : null;
  const messageEnd = stage ? stage.messageEnd : 0;
  const eventEnd = stage ? stage.eventEnd : 0;
  $('#stage-label').textContent = stage ? `${currentStage + 1}/7 · ${stage.name}` : 'Pronto para iniciar';
  $('#progress-fill').style.width = `${started ? ((currentStage + 1) / demo.stages.length) * 100 : 0}%`;
  $('#previous').disabled = currentStage <= 0;
  $('#next').disabled = !started || currentStage >= demo.stages.length - 1;
  $('#pause').disabled = !started || currentStage >= demo.stages.length - 1;
  $('#pause').textContent = isPlaying ? 'Pausar' : 'Continuar';
  $('#start').textContent = started ? '▶ Retomar demonstração' : '▶ Iniciar demonstração';
  $('#message-count').textContent = `${messageEnd} ${messageEnd === 1 ? 'mensagem exibida' : 'mensagens exibidas'}`;

  $('#chat').innerHTML = started ? demo.messages.slice(0, messageEnd).map((message) => `
    <article class="msg ${message.role}"><div class="meta">${safe(message.speaker)} · ${message.role === 'system' ? 'resposta registrada do teste' : 'participante simulado'}</div><div class="bubble">${safe(message.text)}</div></article>`).join('') : '<div class="welcome"><div class="mark">↗</div><h3>Comece pelo pedido,<br>do seu jeito.</h3><p>Quando a demonstração começar, as mensagens do teste aparecem aqui por etapa.</p></div>';
  if (started) $('#chat').scrollTop = $('#chat').scrollHeight;
  $('#events').innerHTML = started ? demo.events.slice(0, eventEnd).map((event) => `<div class="event"><b>${safe(event.title)}</b><p>${safe(event.detail)}</p></div>`).reverse().join('') : '<div class="empty">Aguardando o início.</div>';
  $('#state').innerHTML = stage ? stateMarkup(stage) : '<div class="empty">A demonstração revela cada registro somente quando ele entra na jornada.</div>';
}

function stateMarkup(stage) {
  const fields = Object.entries(stage.facts).map(([label, value], index) => `<div class="fact ${index === 2 ? 'full' : ''}"><label>${safe(label)}</label><p>${safe(value)}</p></div>`).join('');
  const steps = demo.stages.map((_, index) => `<span class="${index <= currentStage ? 'done' : ''}"></span>`).join('');
  const quote = stage.quote ? `<div class="quote"><h3>Orçamento ilustrativo</h3><div class="qrow"><span>Avaliação no local · preço ilustrativo</span><b>R$ 250,00</b></div><div class="qrow"><span>Preparar e pintar a área afetada do teto</span><b>R$ 650,00</b></div><div class="qtotal">R$ 900,00</div><small>Valores somente para demonstrar a jornada. Nenhuma cobrança é emitida.</small></div>` : '';
  return `<p class="kicker">${safe(stage.service)}</p><div class="phase">${safe(stage.phase)}</div><div class="steps">${steps}</div><div class="fact-grid">${fields}</div><div class="next"><b>Próxima ação</b><p>${safe(stage.next)}</p></div>${quote}`;
}

function stop() { clearTimeout(timer); isPlaying = false; render(); }
function schedule() {
  if (!isPlaying) return;
  if (currentStage >= demo.stages.length - 1) { stop(); return; }
  timer = window.setTimeout(() => { currentStage += 1; render(); schedule(); }, reducedMotion ? 6500 : 4000);
}
function start() { clearTimeout(timer); if (currentStage < 0) currentStage = 0; isPlaying = true; render(); schedule(); }
function move(amount) { stop(); currentStage = Math.max(0, Math.min(demo.stages.length - 1, currentStage + amount)); render(); }

async function main() {
  const response = await fetch('demo.json');
  if (!response.ok) throw new Error('Não foi possível carregar a demonstração.');
  demo = await response.json();
  $('#start').addEventListener('click', start);
  $('#pause').addEventListener('click', () => isPlaying ? stop() : start());
  $('#previous').addEventListener('click', () => move(-1));
  $('#next').addEventListener('click', () => move(1));
  $('#restart').addEventListener('click', () => { stop(); currentStage = -1; render(); });
  render();
}

main().catch((error) => { $('#state').innerHTML = `<div class="empty">${safe(error.message)}</div>`; });
