import { describe, expect, it } from 'vitest';
import {
  fillTemplate,
  getTemplatesByCategory,
  validateTemplateVariables,
  getTemplateById,
  PETITION_TEMPLATES,
  TEMPLATE_CATEGORY_LABELS,
  type TemplateCategory,
} from '@/lib/petition-templates';

describe('petition-templates', () => {
  // ─── PETITION_TEMPLATES ───────────────────────────────────────────────────

  describe('PETITION_TEMPLATES', () => {
    it('possui exatamente 10 templates', () => {
      expect(PETITION_TEMPLATES).toHaveLength(10);
    });

    it('todos os templates têm id único', () => {
      const ids = PETITION_TEMPLATES.map((t) => t.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(PETITION_TEMPLATES.length);
    });

    it('todos os templates têm campos obrigatórios', () => {
      for (const template of PETITION_TEMPLATES) {
        expect(template.id.length).toBeGreaterThan(0);
        expect(template.name.length).toBeGreaterThan(0);
        expect(template.category.length).toBeGreaterThan(0);
        expect(template.description.length).toBeGreaterThan(0);
        expect(template.petitionType.length).toBeGreaterThan(0);
        expect(template.content.length).toBeGreaterThan(0);
        expect(Array.isArray(template.variables)).toBe(true);
      }
    });

    it('todos os templates têm ao menos uma variável', () => {
      for (const template of PETITION_TEMPLATES) {
        expect(template.variables.length).toBeGreaterThan(0);
      }
    });

    it('todos os templates têm conteúdo com pelo menos um placeholder', () => {
      for (const template of PETITION_TEMPLATES) {
        expect(template.content).toMatch(/\{\{[^}]+\}\}/);
      }
    });

    it('categorias válidas', () => {
      const validCategories: TemplateCategory[] = [
        'peticao_inicial', 'defesa', 'recurso', 'urgencia', 'constitucional', 'execucao',
      ];
      for (const template of PETITION_TEMPLATES) {
        expect(validCategories).toContain(template.category);
      }
    });
  });

  // ─── fillTemplate ─────────────────────────────────────────────────────────

  describe('fillTemplate', () => {
    const template = PETITION_TEMPLATES[0]; // Petição Inicial Cível

    it('substitui todas as variáveis fornecidas', () => {
      const values = {
        vara: '1ª Vara Cível',
        comarca: 'São Paulo',
        estado: 'SP',
        cliente_nome: 'João Silva',
        parte_contraria: 'Empresa XYZ',
        fatos: 'Fatos do caso...',
        fundamentos: 'Fundamentos jurídicos...',
        pedidos: 'Pedidos da ação...',
        valor_causa: '10.000,00',
        advogado_nome: 'Dr. Advogado',
        advogado_oab: 'OAB/SP 123.456',
        data: '01/06/2026',
        cliente_cpf: '000.000.000-00',
        cliente_rg: '00.000.000-0',
        cliente_profissao: 'Advogado',
        cliente_endereco: 'Rua Teste, 1',
        parte_contraria_cnpj: '00.000.000/0001-00',
      };
      const result = fillTemplate(template, values);
      expect(result).toContain('1ª Vara Cível');
      expect(result).toContain('João Silva');
      expect(result).toContain('Empresa XYZ');
      expect(result).toContain('10.000,00');
    });

    it('variáveis não fornecidas permanecem como placeholder', () => {
      const values = { vara: '1ª Vara Cível' };
      const result = fillTemplate(template, values);
      // {{cliente_nome}} não foi fornecido, deve permanecer
      expect(result).toContain('{{cliente_nome}}');
    });

    it('substitui múltiplas ocorrências do mesmo placeholder', () => {
      const templateComRepetição = PETITION_TEMPLATES.find((t) => t.id === 'inicial-civel')!;
      // {{comarca}} aparece múltiplas vezes no template
      const values = { comarca: 'Campinas' };
      const result = fillTemplate(templateComRepetição, values);
      // Todas as ocorrências devem ser substituídas
      const remaining = (result.match(/\{\{comarca\}\}/g) || []).length;
      expect(remaining).toBe(0);
    });

    it('valor vazio limpa o placeholder', () => {
      const values = { vara: '' };
      const result = fillTemplate(template, values);
      // Placeholder substituído por string vazia
      const varaCount = (result.match(/\{\{vara\}\}/g) || []).length;
      expect(varaCount).toBe(0);
    });

    it('resultado não é string vazia', () => {
      const result = fillTemplate(template, {});
      expect(result.length).toBeGreaterThan(0);
    });
  });

  // ─── getTemplatesByCategory ───────────────────────────────────────────────

  describe('getTemplatesByCategory', () => {
    it('retorna apenas templates da categoria especificada', () => {
      const recursosTemplates = getTemplatesByCategory('recurso');
      for (const t of recursosTemplates) {
        expect(t.category).toBe('recurso');
      }
    });

    it('peticao_inicial retorna pelo menos 1 template', () => {
      const initial = getTemplatesByCategory('peticao_inicial');
      expect(initial.length).toBeGreaterThanOrEqual(1);
    });

    it('recurso retorna pelo menos 2 templates', () => {
      const recurso = getTemplatesByCategory('recurso');
      expect(recurso.length).toBeGreaterThanOrEqual(2);
    });

    it('constitucional retorna pelo menos 2 templates', () => {
      const constitucional = getTemplatesByCategory('constitucional');
      expect(constitucional.length).toBeGreaterThanOrEqual(2);
    });

    it('execucao retorna pelo menos 2 templates', () => {
      const execucao = getTemplatesByCategory('execucao');
      expect(execucao.length).toBeGreaterThanOrEqual(2);
    });
  });

  // ─── validateTemplateVariables ────────────────────────────────────────────

  describe('validateTemplateVariables', () => {
    const template = PETITION_TEMPLATES[0]; // Petição Inicial Cível

    it('válido quando todas as variáveis obrigatórias estão preenchidas', () => {
      const requiredVars = template.variables.filter((v) => v.required);
      const values: Record<string, string> = {};
      for (const v of requiredVars) {
        values[v.name] = 'valor de teste';
      }
      const result = validateTemplateVariables(template, values);
      expect(result.valid).toBe(true);
      expect(result.missing).toHaveLength(0);
    });

    it('inválido quando faltam variáveis obrigatórias', () => {
      const result = validateTemplateVariables(template, {});
      expect(result.valid).toBe(false);
      expect(result.missing.length).toBeGreaterThan(0);
    });

    it('lista as labels das variáveis faltantes', () => {
      const result = validateTemplateVariables(template, {});
      const requiredLabels = template.variables
        .filter((v) => v.required)
        .map((v) => v.label);
      for (const label of requiredLabels) {
        expect(result.missing).toContain(label);
      }
    });

    it('variáveis opcionais não geram erro quando ausentes', () => {
      const requiredVars = template.variables.filter((v) => v.required);
      const values: Record<string, string> = {};
      for (const v of requiredVars) {
        values[v.name] = 'valor';
      }
      const result = validateTemplateVariables(template, values);
      expect(result.valid).toBe(true);
    });

    it('valor apenas com espaços é considerado vazio', () => {
      const templateWithReq = PETITION_TEMPLATES[0];
      const firstRequired = templateWithReq.variables.find((v) => v.required)!;
      const values = { [firstRequired.name]: '   ' };
      const result = validateTemplateVariables(templateWithReq, values);
      expect(result.missing).toContain(firstRequired.label);
    });
  });

  // ─── getTemplateById ──────────────────────────────────────────────────────

  describe('getTemplateById', () => {
    it('retorna template correto por id', () => {
      const template = getTemplateById('inicial-civel');
      expect(template).toBeDefined();
      expect(template?.id).toBe('inicial-civel');
    });

    it('retorna undefined para id inexistente', () => {
      expect(getTemplateById('nao-existe')).toBeUndefined();
    });

    it('todos os ids dos templates podem ser recuperados', () => {
      for (const t of PETITION_TEMPLATES) {
        const found = getTemplateById(t.id);
        expect(found).toBeDefined();
        expect(found?.id).toBe(t.id);
      }
    });
  });

  // ─── TEMPLATE_CATEGORY_LABELS ─────────────────────────────────────────────

  describe('TEMPLATE_CATEGORY_LABELS', () => {
    it('possui labels para todas as categorias', () => {
      const categories: TemplateCategory[] = [
        'peticao_inicial', 'defesa', 'recurso', 'urgencia', 'constitucional', 'execucao',
      ];
      for (const cat of categories) {
        expect(TEMPLATE_CATEGORY_LABELS[cat]).toBeDefined();
        expect(TEMPLATE_CATEGORY_LABELS[cat].length).toBeGreaterThan(0);
      }
    });
  });

  // ─── Estrutura das variáveis ──────────────────────────────────────────────

  describe('estrutura das variáveis', () => {
    it('variáveis de tipo select têm options', () => {
      for (const template of PETITION_TEMPLATES) {
        for (const variable of template.variables) {
          if (variable.type === 'select') {
            expect(variable.options).toBeDefined();
            expect((variable.options ?? []).length).toBeGreaterThan(0);
          }
        }
      }
    });

    it('tipos de variável são válidos', () => {
      const validTypes = ['text', 'textarea', 'date', 'number', 'select'];
      for (const template of PETITION_TEMPLATES) {
        for (const variable of template.variables) {
          expect(validTypes).toContain(variable.type);
        }
      }
    });
  });
});
