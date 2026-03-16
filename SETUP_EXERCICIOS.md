# 🚀 Guia de Configuração - Dados Iniciais

## Problema Identificado

A aplicação necessita de dados iniciais (exercícios) na base de dados para funcionar corretamente. Sem esses dados:
- Não é possível adicionar exercícios manualmente aos planos
- Os planos base ficam sem exercícios
- A biblioteca de exercícios está vazia

## Solução: Seed Data de Exercícios

### Option 1: Via Supabase SQL Editor (Recomendado)

1. **Acede ao Supabase Dashboard**
   - Va para: https://app.supabase.com/
   - Seleciona o teu projeto "skehofopzhnhzhhqtnam"

2. **Vai para SQL Editor**
   - Clica em "SQL Editor" na sidebar esquerda
   - Clica em "+ New Query"

3. **Copia o SQL**
   - Abre o ficheiro: `/fitpwa/sql/seed_exercises.sql`
   - Copia TODO o conteúdo SQL

4. **Cola e Executa**
   - Cola no SQL Editor
   - Clica em "Run" ou pressiona `Ctrl+Enter`
   - Deves ver: "X rows inserted successfully"

5. **Verifica o Resultado**
   - Vai para "Table Editor"
   - Seleciona a tabela "exercises"
   - Deves ver ~20 exercícios listados

### Option 2: Via Editor de Tabelas (Manual)

Se preferires inserir manualmente:

1. Vai para "Table Editor"
2. Seleciona "exercises"
3. Clica em "+ Insert Row"
4. Preenche os campos:
   - `id`: squat (único, sem espaços)
   - `name`: Agachamento com Barra
   - `category`: legs
   - `muscle_groups`: {perna, glúteos}
   - `difficulty`: intermediate
   - `description`: Exercício composto para perna inferior
   - `image_url`: https://images.unsplash.com/...
   - `video_url`: https://example.com

5. Repete para cada exercício

## Dados Incluídos no Seed

O seed inclui 20 exercícios básicos:

### 🦵 Perna (4)
- Agachamento com Barra
- Leg Press 45°
- Leg Curl
- Leg Extension

### 💪 Peito (4)
- Supino com Barra
- Supino Inclinado
- Supino com Halteres
- Pec Deck

### 🤜 Costas (4)
- Linha Curvada
- Remada com Halteres
- Lat Pulldown
- Face Pull

### 💪 Ombros (3)
- Militar Press
- Elevação Lateral
- Reverse Pec Deck

### 🙌 Braços (4)
- Rosca Direta
- Rosca Halteres
- Tricep Pushdown
- Extensão Aérea

### 🏋️ Compostos (1)
- Levantamento Terra
- Prancha
- Crunch

## Após Adicionar os Exercícios

1. **Volta à app**
   - Recarrega a página (`Ctrl+R`)
   - Os exercícios devem aparecer ao criar/editar planos

2. **Testa Funcionalidades**
   - Vai para "Novo Plano" → clicka "Adicionar Exercício" → deves ver a lista completa
   - Cria um plano base → agora terá exercícios pré-inseridos
   - Tenta treino rápido → deves poder selecionar exercícios

3. **Se ainda não funcionar**
   - Verifica a consola (F12) para erros
   - Assegura-te que a tabela `exercises` existe
   - Confirma que os dados foram inseridos (20 filas)

## Estrutura da Tabela exercises

```sql
CREATE TABLE exercises (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  muscle_groups TEXT[], -- Array JSON
  difficulty TEXT, -- 'beginner', 'intermediate', 'advanced'
  description TEXT,
  image_url TEXT,
  video_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Notas Importantes

- Os `id` devem ser **únicos** e **sem espaços** (usar hífens)
- `muscle_groups` é um array (ex: {perna, glúteos})
- As imagens são do Unsplash (URLs públicas, sem API key)
- Podes adicionar mais exercícios depois sem problema

---

📝 **Próximos Passos:**
1. Executa o SQL seed
2. Recarrega a app
3. Testa criar um novo plano com exercícios
4. Testa a biblioteca de exercícios

Se tiver problemas, verifica os logs do navegador (F12 → Console).
