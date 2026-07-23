/**
 * Secure calculator formula engine.
 * Never uses eval/Function. Supports arithmetic, comparisons, if(), and rule maps.
 */

export type FormulaMap = {
  type?: 'static' | 'rules' | 'api';
  outputs?: Record<string, string>;
  rules?: Array<{ when: string; outputs: Record<string, string> }>;
  api?: {
    url: string;
    method?: 'GET' | 'POST';
    /** Map output key → JSON path from response (dot notation) */
    outputMap?: Record<string, string>;
  };
};

const MAX_NODES = 800;
const MAX_DEPTH = 40;

type Tok =
  | { t: 'num'; v: number }
  | { t: 'id'; v: string }
  | { t: 'op'; v: string }
  | { t: 'lp' }
  | { t: 'rp' }
  | { t: 'comma' }
  | { t: 'qmark' }
  | { t: 'colon' };

function tokenize(input: string): Tok[] {
  const src = input.replace(/\s+/g, '');
  const tokens: Tok[] = [];
  let i = 0;
  while (i < src.length) {
    const ch = src[i]!;
    if (/[0-9.]/.test(ch)) {
      let j = i + 1;
      while (j < src.length && /[0-9.]/.test(src[j]!)) j += 1;
      const n = Number(src.slice(i, j));
      if (!Number.isFinite(n)) throw new Error(`Invalid number near "${src.slice(i, j)}"`);
      tokens.push({ t: 'num', v: n });
      i = j;
      continue;
    }
    if (/[a-zA-Z_]/.test(ch)) {
      let j = i + 1;
      while (j < src.length && /[a-zA-Z0-9_]/.test(src[j]!)) j += 1;
      tokens.push({ t: 'id', v: src.slice(i, j) });
      i = j;
      continue;
    }
    if (ch === '?' ) {
      tokens.push({ t: 'qmark' });
      i += 1;
      continue;
    }
    if (ch === ':') {
      tokens.push({ t: 'colon' });
      i += 1;
      continue;
    }
    if (ch === '=' && src[i + 1] === '=') {
      tokens.push({ t: 'op', v: '==' });
      i += 2;
      continue;
    }
    if (ch === '!' && src[i + 1] === '=') {
      tokens.push({ t: 'op', v: '!=' });
      i += 2;
      continue;
    }
    if (ch === '>' && src[i + 1] === '=') {
      tokens.push({ t: 'op', v: '>=' });
      i += 2;
      continue;
    }
    if (ch === '<' && src[i + 1] === '=') {
      tokens.push({ t: 'op', v: '<=' });
      i += 2;
      continue;
    }
    if ('+-*/%^><'.includes(ch)) {
      tokens.push({ t: 'op', v: ch });
      i += 1;
      continue;
    }
    if (ch === '(') {
      tokens.push({ t: 'lp' });
      i += 1;
      continue;
    }
    if (ch === ')') {
      tokens.push({ t: 'rp' });
      i += 1;
      continue;
    }
    if (ch === ',') {
      tokens.push({ t: 'comma' });
      i += 1;
      continue;
    }
    throw new Error(`Unexpected character "${ch}" in formula`);
  }
  return tokens;
}

type EvalFn = (scope: Record<string, number>, depth: number) => number;

class Parser {
  private i = 0;
  private nodes = 0;
  constructor(private readonly tokens: Tok[]) {}

  private bump() {
    this.nodes += 1;
    if (this.nodes > MAX_NODES) throw new Error('Formula too complex');
  }

  private peek() {
    return this.tokens[this.i];
  }

  private take() {
    return this.tokens[this.i++];
  }

  parse(): EvalFn {
    const expr = this.parseTernary();
    if (this.peek()) throw new Error('Unexpected trailing tokens in formula');
    return expr;
  }

  private parseTernary(): EvalFn {
    let left = this.parseCompare();
    if (this.peek()?.t === 'qmark') {
      this.take();
      const thenExpr = this.parseTernary();
      if (this.take()?.t !== 'colon') throw new Error('Expected : in ternary');
      const elseExpr = this.parseTernary();
      const cond = left;
      left = (scope, depth) => {
        this.assertDepth(depth);
        return cond(scope, depth + 1) ? thenExpr(scope, depth + 1) : elseExpr(scope, depth + 1);
      };
    }
    return left;
  }

  private parseCompare(): EvalFn {
    let left = this.parseAdd();
    while (true) {
      const next = this.peek();
      if (
        !(
          next?.t === 'op' &&
          (next.v === '>' ||
            next.v === '<' ||
            next.v === '>=' ||
            next.v === '<=' ||
            next.v === '==' ||
            next.v === '!=')
        )
      ) {
        break;
      }
      const op = (this.take() as Extract<Tok, { t: 'op' }>).v;
      const right = this.parseAdd();
      const prev = left;
      left = (scope, depth) => {
        this.assertDepth(depth);
        const a = prev(scope, depth + 1);
        const b = right(scope, depth + 1);
        switch (op) {
          case '>':
            return a > b ? 1 : 0;
          case '<':
            return a < b ? 1 : 0;
          case '>=':
            return a >= b ? 1 : 0;
          case '<=':
            return a <= b ? 1 : 0;
          case '==':
            return a === b ? 1 : 0;
          case '!=':
            return a !== b ? 1 : 0;
          default:
            return 0;
        }
      };
    }
    return left;
  }

  private parseAdd(): EvalFn {
    let left = this.parseMul();
    while (true) {
      const next = this.peek();
      if (!(next?.t === 'op' && (next.v === '+' || next.v === '-'))) break;
      const op = (this.take() as Extract<Tok, { t: 'op' }>).v;
      const right = this.parseMul();
      const prev = left;
      left = (scope, depth) => {
        this.assertDepth(depth);
        const a = prev(scope, depth + 1);
        const b = right(scope, depth + 1);
        return op === '+' ? a + b : a - b;
      };
    }
    return left;
  }

  private parseMul(): EvalFn {
    let left = this.parsePow();
    while (true) {
      const next = this.peek();
      if (!(next?.t === 'op' && (next.v === '*' || next.v === '/' || next.v === '%'))) break;
      const op = (this.take() as Extract<Tok, { t: 'op' }>).v;
      const right = this.parsePow();
      const prev = left;
      left = (scope, depth) => {
        this.assertDepth(depth);
        const a = prev(scope, depth + 1);
        const b = right(scope, depth + 1);
        if (op === '/') {
          if (b === 0) throw new Error('Division by zero');
          return a / b;
        }
        if (op === '%') {
          if (b === 0) throw new Error('Division by zero');
          return a % b;
        }
        return a * b;
      };
    }
    return left;
  }

  private parsePow(): EvalFn {
    let left = this.parseUnary();
    const next = this.peek();
    if (next?.t === 'op' && next.v === '^') {
      this.take();
      const right = this.parsePow();
      const prev = left;
      left = (scope, depth) => {
        this.assertDepth(depth);
        return Math.pow(prev(scope, depth + 1), right(scope, depth + 1));
      };
    }
    return left;
  }

  private parseUnary(): EvalFn {
    const next = this.peek();
    if (next?.t === 'op' && (next.v === '+' || next.v === '-')) {
      const op = (this.take() as Extract<Tok, { t: 'op' }>).v;
      const expr = this.parseUnary();
      return (scope, depth) => {
        this.assertDepth(depth);
        const v = expr(scope, depth + 1);
        return op === '-' ? -v : v;
      };
    }
    return this.parsePrimary();
  }

  private parsePrimary(): EvalFn {
    this.bump();
    const tok = this.take();
    if (!tok) throw new Error('Unexpected end of formula');
    if (tok.t === 'num') return () => tok.v;
    if (tok.t === 'id') {
      const name = tok.v;
      if (this.peek()?.t === 'lp') {
        this.take();
        const args: EvalFn[] = [];
        if (this.peek()?.t !== 'rp') {
          args.push(this.parseTernary());
          while (this.peek()?.t === 'comma') {
            this.take();
            args.push(this.parseTernary());
          }
        }
        if (this.take()?.t !== 'rp') throw new Error(`Expected ) after ${name}(`);
        return (scope, depth) => {
          this.assertDepth(depth);
          const vals = args.map((a) => a(scope, depth + 1));
          return callFn(name, vals);
        };
      }
      return (scope, depth) => {
        this.assertDepth(depth);
        if (!(name in scope) || !Number.isFinite(scope[name]!)) {
          throw new Error(`Unknown or non-numeric variable "${name}"`);
        }
        return scope[name]!;
      };
    }
    if (tok.t === 'lp') {
      const expr = this.parseTernary();
      if (this.take()?.t !== 'rp') throw new Error('Expected )');
      return expr;
    }
    throw new Error('Invalid formula expression');
  }

  private assertDepth(depth: number) {
    if (depth > MAX_DEPTH) throw new Error('Formula nesting too deep');
  }
}

function callFn(name: string, args: number[]): number {
  const n = name.toLowerCase();
  switch (n) {
    case 'pow':
      if (args.length !== 2) throw new Error('pow(a,b) expects 2 args');
      return Math.pow(args[0]!, args[1]!);
    case 'round':
      if (args.length < 1 || args.length > 2) throw new Error('round(x[,digits])');
      if (args.length === 1) return Math.round(args[0]!);
      {
        const f = 10 ** args[1]!;
        return Math.round(args[0]! * f) / f;
      }
    case 'floor':
      if (args.length !== 1) throw new Error('floor(x)');
      return Math.floor(args[0]!);
    case 'ceil':
    case 'ceiling':
      if (args.length !== 1) throw new Error('ceil(x)');
      return Math.ceil(args[0]!);
    case 'min':
      if (!args.length) throw new Error('min(...) needs args');
      return Math.min(...args);
    case 'max':
      if (!args.length) throw new Error('max(...) needs args');
      return Math.max(...args);
    case 'abs':
      if (args.length !== 1) throw new Error('abs(x)');
      return Math.abs(args[0]!);
    case 'sqrt':
      if (args.length !== 1) throw new Error('sqrt(x)');
      if (args[0]! < 0) throw new Error('sqrt of negative');
      return Math.sqrt(args[0]!);
    case 'if':
      if (args.length !== 3) throw new Error('if(cond, then, else)');
      return args[0]! ? args[1]! : args[2]!;
    default:
      throw new Error(`Unsupported function "${name}"`);
  }
}

function evalOutputs(outputs: Record<string, string>, inputs: Record<string, unknown>) {
  const scope: Record<string, number> = {};
  for (const [k, v] of Object.entries(inputs)) {
    if (typeof v === 'boolean') {
      scope[k] = v ? 1 : 0;
      continue;
    }
    const n = typeof v === 'number' ? v : Number(v);
    if (Number.isFinite(n)) scope[k] = n;
  }

  const result: Record<string, number> = {};
  for (const [key, expr] of Object.entries(outputs)) {
    const fn = new Parser(tokenize(expr)).parse();
    const value = fn(scope, 0);
    if (!Number.isFinite(value)) throw new Error(`Output "${key}" is not a finite number`);
    result[key] = value;
    scope[key] = value;
  }
  return result;
}

export function parseFormulaDefinition(raw: string | null | undefined): FormulaMap {
  if (!raw?.trim()) {
    throw new Error('Calculator has no formula configured');
  }
  const trimmed = raw.trim();
  if (trimmed.startsWith('{')) {
    const parsed = JSON.parse(trimmed) as FormulaMap;
    if (parsed.type === 'api') {
      if (!parsed.api?.url) throw new Error('API formula requires api.url');
      return parsed;
    }
    if (parsed.type === 'rules') {
      if (!parsed.rules?.length) throw new Error('Rules formula requires rules[]');
      return parsed;
    }
    if (!parsed?.outputs || typeof parsed.outputs !== 'object') {
      throw new Error('Formula JSON must include an "outputs" object');
    }
    return { ...parsed, type: parsed.type ?? 'static' };
  }
  return { type: 'static', outputs: { result: trimmed } };
}

function validateExprMap(outputs: Record<string, string>) {
  for (const [key, expr] of Object.entries(outputs)) {
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key)) {
      throw new Error(`Invalid output key "${key}"`);
    }
    new Parser(tokenize(expr)).parse();
  }
}

export function validateFormula(raw: string | null | undefined): { ok: true } | { ok: false; message: string } {
  try {
    const def = parseFormulaDefinition(raw);
    if (def.type === 'api') return { ok: true };
    if (def.type === 'rules') {
      for (const rule of def.rules ?? []) {
        new Parser(tokenize(rule.when)).parse();
        validateExprMap(rule.outputs);
      }
      if (def.outputs) validateExprMap(def.outputs);
      return { ok: true };
    }
    validateExprMap(def.outputs ?? {});
    return { ok: true };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : 'Invalid formula' };
  }
}

function getByPath(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object' && key in (acc as object)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

function isHostAllowed(url: string): boolean {
  const allow = (process.env.CALCULATOR_API_ALLOWLIST || '')
    .split(',')
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);
  if (!allow.length) return false;
  try {
    const host = new URL(url).hostname.toLowerCase();
    return allow.some((a) => host === a || host.endsWith(`.${a}`));
  } catch {
    return false;
  }
}

export async function executeFormula(
  raw: string | null | undefined,
  inputs: Record<string, unknown>,
): Promise<Record<string, number>> {
  const def = parseFormulaDefinition(raw);

  if (def.type === 'api' && def.api) {
    if (!isHostAllowed(def.api.url)) {
      throw new Error('External calculator API host is not allowlisted');
    }
    const method = def.api.method ?? 'POST';
    const res = await fetch(def.api.url, {
      method,
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: method === 'POST' ? JSON.stringify({ inputs }) : undefined,
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`External API failed (${res.status})`);
    const json = (await res.json()) as unknown;
    const map = def.api.outputMap ?? { result: 'result' };
    const outputs: Record<string, number> = {};
    for (const [key, path] of Object.entries(map)) {
      const val = getByPath(json, path);
      const n = typeof val === 'number' ? val : Number(val);
      if (!Number.isFinite(n)) throw new Error(`API output "${key}" is not numeric`);
      outputs[key] = n;
    }
    return outputs;
  }

  if (def.type === 'rules' && def.rules?.length) {
    const scopeInputs = { ...inputs };
    for (const rule of def.rules) {
      const cond = evalOutputs({ _cond: rule.when }, scopeInputs)._cond;
      if (cond) {
        return evalOutputs(rule.outputs, scopeInputs);
      }
    }
    if (def.outputs) return evalOutputs(def.outputs, scopeInputs);
    throw new Error('No matching rule and no default outputs');
  }

  return evalOutputs(def.outputs ?? {}, inputs);
}
