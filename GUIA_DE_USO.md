# 🎯 Guia de Uso - FitPWA v1.2.0

## 🚀 Começar Rápido

### 1. Iniciar o Projeto
```bash
npm install    # Se for primeira vez
npm run dev    # Inicia servidor de desenvolvimento
```

Acede a `http://localhost:5173` no navegador.

---

## 👤 Primeiro Acesso

### Register (Criar Conta)
1. Clique em **"Sign Up"**
2. Preencha email e password
3. Clique em **"Create Account"**
4. Complete o **Onboarding Flow** (selecionar objetivos/nível)

### Login
1. Clique em **"Login"**
2. Insira email e password
3. Click **"Sign In"**

---

## 💪 Usar Planos de Treino (Original)

### Ver Meus Planos
1. Vá para **"Treinos"** (navbar)
2. Verá 3 opções no topo:
   - 🔵 **Plano Base** - Treino padrão
   - 🟡 **Treino Rápido** - Exercícios soltos
   - 🟢 **Novo Plano** - Criar personalizad

### Criar Novo Plano
1. Clique **"Novo Plano"** 
2. Dê um nome (ex: "Upper Body")
3. Selecione exercícios
4. Configure sets/reps para cada um
5. Clique **"Salvar Plano"**

### Iniciar Treino (Plano)
1. Na lista de planos, clique no plano
2. Clique **"Começar Treino"**
3. Aparece a tela de sessão
4. Complete sets conforme indicado
5. Clique **"Finalizar Treino"**

---

## 🚀 NOVO: Treino Rápido (Sem Plano)

Este é o recurso principal novo! Permite fazer treinos ad-hoc:

### Como Usar

**Passo 1**: Vá para **"Treinos"** → Clique em **"Treino Rápido"** (card amarelo)

**Passo 2**: Pesquise exercícios
- Escreva na barra de pesquisa (ex: "supino")
- Ou clique em filtros de grupo muscular:
  - Peito, Costas, Ombro, Bíceps, Tríceps
  - Antebraço, Pernas, Femorais, Glúteos
  - Abdominais, Core

**Passo 3**: Adiciona exercício
- Selecione exercício
- Configure:
  - **Sets**: Número de séries (ex: 3)
  - **Reps**: Repetições (ex: 10)
  - **Peso**: Kg (ex: 80)
- Clique **"Adicionar"**

**Passo 4**: Construa seu treino
- Pode adicionar quantos exercícios quiser
- Ver imagem do exercício (quando disponível)
- Exemplo treino:
  - Supino: 3 sets x 10 reps x 80 kg
  - Rosca Direta: 3 sets x 12 reps x 25 kg
  - Extensão de Tríceps: 3 sets x 15 reps x 20 kg

**Passo 5**: Inicie o treino
- Clique **"Começar Treino"**
- Aparece a tela de sessão com seus exercícios
- Complete todo o treino normalmente

**Passo 6**: Veja seus registos
- Após finalizar, vá para **"Registos"** 
- Verá seu treino no histórico

---

## 📊 NOVO: Registos (Personal Records & Histórico)

### Acessar Registos

**Opção 1**: Navbar → Clique **"Registos"** (Trophy icon)  
**Opção 2**: Dashboard → Clique **"Ver Meus Registos"**

### O Que Ver

#### 📈 **Estatísticas** (3 cards no topo)
1. **Total de Treinos**: Quantas sessões completou
2. **Volume Total**: Kg total levantado (soma de todos PRs)
3. **Melhor Exercício**: Seu exercício com mais peso

#### 🏆 **Personal Records (PRs)**
- **Lista ordenada por peso** (maior primeiro)
- Exemplo:
  ```
  Deadlift: 150 kg x 3 reps (12 Mar 2025)
  Supino:  100 kg x 5 reps (10 Mar 2025)
  Agachamento: 120 kg x 6 reps (8 Mar 2025)
  ```
- Cada exercício tem apenas 1 PR (melhor marca)

#### 📅 **Histórico de Treinos**
- **Últimas 20 sessões**
- Informação:
  - Exercício
  - Sets completados
  - Duração (em minutos)
  - Data/hora

---

## 📱 Sessão de Treino (Como Funciona)

### Durante a Sessão

1. **Começar Set**
   - Clique **"Começar Set"**
   - Começa contagem regressiva

2. **Completar Exercício**
   - Clique ✅ para marcar como feito
   - Aparece o próximo exercício

3. **Informações do Set**
   - Tempo do set
   - Sets completados vs. planejados
   - Próximo exercício em fila

4. **Finalizar Treino**
   - Clique **"Finalizar Treino"**
   - Aparece resumo
   - Treino é salvo em histórico

### Resumo Final
- Total de sets completados
- Tempo total de sessão
- Exercícios realizados
- Opção de salvar ou descartar

---

## 🖼️ Imagens nos Exercícios

Todos os exercícios agora têm imagens (quando disponível):
- Vistas em "Treino Rápido" ao seleccionar
- Demonstra o exercício visualmente
- Carregadas do Unsplash (público)
- Se não carregar, mostra placeholder

### Exercícios com Imagem
- ✅ Supino (Bench Press)
- ✅ Rosca Direta (Barbell Curl)
- ✅ Deadlift
- ✅ Agachamento (Squat)
- ✅ Pull-ups
- ✅ E muitos mais...

---

## 🎮 Gamificação

### Achievements (Conquistas)
Aparece notificação ao ganhar:
- 🥇 Primeira sessão completada
- 🥈 10 sessões completadas
- 🥉 Novo PR setado
- E mais...

### Streaks (Sequências)
- Treina dia seguido? Conta como streak
- Vê seu streak na dashboard

### Pontos
- Cada sessão = pontos
- Treinos mais longos = mais pontos
- Novos PRs = bónus pontos

---

## 💎 Premium Features

### O Que É Premium?
- Treinos personalizados (AI)
- Análise avançada de PRs
- Planos para competição
- Sem limite de planos

### Como Ativar?
1. Vá para **"Premium"**
2. Clique **"Ativar Premium"**
3. Stripe checkout
4. Sucesso! Premium ativado

---

## 👥 Comunidade

### Ver Planos Compartilhados
1. Vá para **"Comunidade"**
2. Veja planos de outros
3. Filtrar por dificuldade
4. Clicar para ver detalhes
5. Copiar para seus planos

### Partilhar Seu Plano
1. Vá para "Meus Planos"
2. Clique em um plano
3. Clique **"Partilhar"**
4. Seleccione "Público"
5. Pronto! Outros veem seu plano

---

## ⚙️ Configurações & Perfil

### Editar Perfil
1. Navbar → **"Perfil"** ou ícone de user
2. Clique **"Editar"**
3. Mude:
   - Nome
   - Foto
   - Bio
   - Objetivo
4. Clique **"Salvar"**

### Ver Perfil Público
- Seu perfil é visível em `/profile/seu-id`
- Mostra seus PRs e stats
- Outros podem copiar seus planos

---

## 📝 Notas & Observações

### Adicionar Notas
1. Na sessão/plano, clique **"Adicionar Nota"**
2. Escreva observações
3. Salve

### Ver Histórico de Notas
1. Vá ao plano/sessão
2. Clique **"Notas"**
3. Ver todas as notas antigas

---

## 🔒 Privacidade & Segurança

- Seus dados são **privados** por padrão
- Apenas você vê seus PRs e histórico
- Partilhamento é **opcional**
- Dados guardados em Supabase (seguro)

---

## 📱 Offline & PWA

### Instalar no Telemóvel

**iOS:**
1. Abra FitPWA no Safari
2. Clique partilha → "Adicionar à Home Screen"

**Android:**
1. Abra FitPWA no Chrome
2. Menu → "Instalar app"

### Offline
- Pode ver planos offline
- Treinos gravam localmente
- Sincroniza quando online

---

## 🐛 Troubleshooting

### Problema: Treino não salva
**Solução**: Clique "Finalizar Treino" → Verificará BD

### Problema: Imagens não carregam
**Solução**: Aguarde 2 seg. Imagens carregam do Unsplash

### Problema: Conta não ativa
**Solução**: Verifique email de confirmação

### Problema: Stripe error
**Solução**: Teste com cards de teste Stripe:
- `4242 4242 4242 4242` (sucesso)
- `4000 0000 0000 0002` (falha)

---

## 🎯 Dicas & Truques

### 💡 Dica 1: Treino Rápido vs. Plano
- **Treino Rápido**: Para dias que não quer seguir plano
- **Plano**: Para programação estruturada

### 💡 Dica 2: Pesquisa Rápida
- Pesquisa é case-insensitive
- Procura por "supino", "bench", "press" funciona

### 💡 Dica 3: Monitorizar PRs
- Vá a Registos após cada treino
- Veja se bateu novo PR (automaticamente detectado)

### 💡 Dica 4: Partilhar Planos
- Planos populares ganham "upvotes"
- Você ganha pontos por compartilhar

### 💡 Dica 5: Streaks
- Treina 3 dias seguidos = achievement
- Treina 1 mês seguido = badge rara

---

## 🆘 Ajuda & Suporte

### Contactar Suporte
- Email: support@fitpwa.com
- Discord: [Link to Discord]
- GitHub Issues: [Link to GitHub]

### FAQ

**P: Posso usar sem Premium?**  
R: Sim! Premium é apenas para features avançadas.

**P: Quantos planos posso criar?**  
R: Sem limite. Premium desbloqueia mais.

**P: Posso deletar treino?**  
R: Histórico é imutável (para rastreabilidade). Contate suporte para deleção.

**P: Sincronização em tempo real?**  
R: Sim! Dados sincronizam em segundos.

---

**Happy Training! 💪**

Version: 1.2.0  
Last Updated: March 2025
