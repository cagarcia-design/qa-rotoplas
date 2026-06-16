// scripts/dash-reporter.js
// Reporter de Playwright para el PANEL QA B2C (scripts/dashboard.js).
//
// Emite una línea JSON por evento, prefijada con "@@DASH ", para que el panel
// pinte EN VIVO qué test está corriendo, si pasó, y —si falló— por qué, sin
// tener que parsear los símbolos del reporter `list` (frágil y dependiente de TTY).
//
// El panel filtra las líneas "@@DASH " del log técnico y las usa para la tira de
// actividad. El reporter `list` sigue activo en paralelo → el detalle técnico
// crudo no se pierde.
//
// Se engancha con:  --reporter=./scripts/dash-reporter.js,list
//
// Eventos:
//   {ev:'start',  total}                         → cuántos tests va a correr
//   {ev:'begin',  title, suite}                  → un test arrancó
//   {ev:'end', title, suite, status, expected, outcome, ms, error} → un test terminó
//   status   ∈ passed | failed | timedOut | skipped | interrupted (lo que PASÓ)
//   expected ∈ passed | failed | skipped …                        (lo que SE ESPERABA)
//   outcome  ∈ expected | unexpected | flaky | skipped            (el VEREDICTO real)
//
// Distinguir outcome de status es lo que evita pintar un BASELINE (bug conocido que
// "falla como se espera" → veredicto OK) como si fuera una REGRESIÓN roja. Un test
// marcado test.fail() tiene expected='failed': si falla, outcome='expected' (bien);
// si pasa, outcome='unexpected' (el bug se arregló → hay que cerrar el ticket).

class DashReporter {
  onBegin(_config, suite) {
    let total = 0;
    try { total = suite.allTests().length; } catch (_) {}
    this._emit({ ev: 'start', total });
  }

  onTestBegin(test) {
    this._emit({ ev: 'begin', title: test.title, suite: this._suite(test) });
  }

  onTestEnd(test, result) {
    let outcome = '';
    try { outcome = test.outcome(); } catch (_) {}
    this._emit({
      ev: 'end',
      title: test.title,
      suite: this._suite(test),
      status: result.status,
      expected: test.expectedStatus || 'passed',
      outcome: outcome,
      ms: Math.round(result.duration || 0),
      error: result.error ? this._clean(result.error.message) : '',
    });
  }

  // describe inmediato del test (sin el tag @contract/@health → más legible)
  _suite(test) {
    const t = (test.parent && test.parent.title) || '';
    return t.replace(/@\w+\s*/g, '').trim();
  }

  // limpia códigos ANSI, colapsa a una línea corta legible para la UI
  _clean(s) {
    return String(s || '')
      .replace(/\[[0-9;]*m/g, '')
      .split('\n').slice(0, 5).join(' · ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 320);
  }

  _emit(obj) {
    try { process.stdout.write('@@DASH ' + JSON.stringify(obj) + '\n'); } catch (_) {}
  }
}

module.exports = DashReporter;
