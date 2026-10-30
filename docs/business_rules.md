# Regras de negócio

Fonte para o banco e para o app. Enquanto este arquivo não mudar, código e SQL não inventam outra regra.

## Produto

A empresa deposita na conta dela no gateway de pagamento e, pelo app, transfere para a conta pessoal do funcionário. O funcionário envia comprovantes. A empresa confere, dá baixa no valor aceito e vê se sobrou dinheiro com o funcionário ou se precisa reembolsar.

A subconta do funcionário existe só no app. O gateway não abre conta para ele. O domínio não cita o nome do gateway: a conta é `payment_accounts` e o adaptador é a coluna `provider`.

## Papéis

Os dois papéis entram pelo navegador e pelo smartphone. A permissão não muda conforme o aparelho.

| Papel | Pode | Não pode |
|---|---|---|
| Empresa (admin) | Cadastrar funcionário e chave Pix, transferir, reembolsar, ver fila, dar baixa, acompanhar saldo | — |
| Funcionário | Ver a própria subconta e enviar comprovante | Transferir, reembolsar, ver outro funcionário, alterar comprovante já enviado, dar baixa |

Um usuário pertence a uma empresa. O primeiro usuário da empresa é admin.

## Saldo da subconta

Em centavos, sempre derivado dos lançamentos. Não existe coluna de saldo editável.

```
saldo = pix_de_adiantamento + pix_de_reembolso − valores_baixados − devoluções
```

| Saldo | Significado | Próximo passo |
|---|---|---|
| > 0 | A empresa transferiu mais do que já foi baixado | Devolução da sobra |
| < 0 | O valor baixado passou do que o funcionário recebeu | Reembolso com outro Pix |
| = 0 | Prestação fechada | Nenhum Pix |

Comprovante em análise não entra na fórmula. Comprovante recusado também não.

O app mostra, separados: transferido, em análise, baixado, saldo.

## Transferência e reembolso

Os dois são Pix da conta da empresa no gateway para a chave Pix já cadastrada do funcionário. Quem dispara é o admin.

- Adiantamento aumenta o saldo quando o gateway confirma a transferência.
- Reembolso também aumenta o saldo quando o gateway confirma a transferência. Serve para cobrir saldo negativo.
- O clique em transferir cria uma ordem pendente. O saldo só muda com essa confirmação.
- Falha ou cancelamento não lança saldo.
- A mesma ordem não pode gerar dois Pix. A referência enviada ao gateway é o id da ordem. O id que o gateway devolve fica em `provider_transfer_id`.
- A chave Pix não é digitada de novo a cada envio.

## Comprovante

O funcionário informa valor, categoria e foto.

Categorias: combustível, alimentação, pedágio, hospedagem, manutenção, insumos, frete, outros.

- Valor informado maior que zero.
- Foto obrigatória.
- Depois de enviado, o funcionário não edita e não apaga.
- No smartphone, a foto pode ficar na fila do aparelho e subir quando houver rede. No navegador, o envio é online.
- Estado inicial: em análise.

Fazenda, talhão ou placa são texto opcional neste ciclo. Cadastro próprio desses centros fica para depois.

## Baixa

Só o admin da mesma empresa, e só em comprovante ainda em análise.

O valor aceito é um número entre zero e o valor informado, inclusive.

| Valor aceito | Estado | Efeito no saldo |
|---|---|---|
| Igual ao informado | Aprovado | Abate esse valor |
| Entre zero e o informado | Parcial | Abate só o aceito |
| Zero | Recusado | Não abate |

A baixa acontece uma vez. O que não foi aceito não vira dívida automática: simplesmente não entra no saldo. Se ainda precisar comprovar, o funcionário envia outro comprovante.

## Devolução da sobra

Quando o saldo está positivo, a empresa gera uma cobrança Pix identificada, no valor da sobra (ou de parte dela), para a conta dela no gateway. Quando o pagamento entra, o lançamento de devolução diminui o saldo. O id da cobrança no gateway fica em `provider_charge_id`.

Sem a confirmação desse pagamento, o saldo positivo permanece.

## Lançamentos

Imutáveis. Cada um referencia a ordem de Pix, o comprovante ou a cobrança de devolução que o originou.

| Tipo | Quando nasce | Efeito |
|---|---|---|
| Adiantamento | Pix ao funcionário confirmado | Aumenta o saldo |
| Reembolso | Pix de cobertura confirmado | Aumenta o saldo |
| Baixa | Admin aceita valor > 0 | Diminui o saldo |
| Devolução | Cobrança de sobra paga | Diminui o saldo |

Recusa e ordem com falha não geram lançamento.

## Conta de pagamento da empresa

Cada empresa conecta a própria conta num gateway. Uma empresa, uma conta. Trocar de gateway substitui essa linha.

`provider` é o código do adaptador. Não é um enum fechado no banco: um gateway novo entra como adaptador, sem mudar o nome das tabelas.

A chave de API e o segredo do webhook ficam só no servidor, cifrados, e nunca voltam para o navegador nem para o smartphone.

Ambiente inicial: sandbox.

O dinheiro das empresas não fica na conta da Zampell. Cobrança da mensalidade do SaaS fica fora deste ciclo.

## Conferência antes de codar o banco

- Todo dado de negócio carrega a empresa.
- Funcionário lê só a própria subconta e os próprios comprovantes.
- Admin lê e age só na empresa dele.
- Cliente não grava lançamento direto. Baixa, comprovante e ordem de Pix passam por operação no servidor.
- Webhook do gateway é a única confirmação de Pix enviado ou de devolução recebida.
- Valores em centavos, inteiros.
