# Regras de negócio

Fonte para o banco e para o app. Enquanto este arquivo não mudar, código e SQL não inventam outra regra.

## Produto

Neste ciclo não há gateway real. A empresa adiciona saldo na conta principal, manualmente, dentro do app. O valor enviado ao colaborador sai desse saldo na mesma hora e entra na subconta dele. O funcionário envia comprovantes. A empresa confere, dá baixa no valor aceito e vê se sobrou dinheiro com o funcionário ou se precisa reembolsar.

A subconta do funcionário existe só no app. O domínio não cita nome de gateway.

## Papéis

Os dois papéis entram pelo navegador e pelo smartphone. A permissão não muda conforme o aparelho.

| Papel | Pode | Não pode |
|---|---|---|
| Empresa (admin) | Cadastrar funcionário e chave Pix, transferir, reembolsar, ver fila, dar baixa, acompanhar saldo | — |
| Funcionário | Ver a própria subconta, enviar comprovante e corrigir ou excluir o que ainda está em análise | Transferir, reembolsar, ver outro funcionário, alterar comprovante já baixado, dar baixa |

Um usuário pertence a uma empresa. O primeiro usuário da empresa é admin. Quem já foi aberto como colaborador não cria empresa.

O colaborador não cria a própria conta. No cadastro, a empresa informa o e-mail que ele passou, o cargo, o telefone com DDD e o endereço. O CEP de 8 dígitos preenche rua, bairro, cidade e UF. Número e complemento ficam com a empresa. A data de admissão é opcional. Cadastro antigo, sem esses dados, continua válido. O sistema gera a senha temporária, mostra uma vez para entregar em mãos e não grava esse texto. Ela vale 24 horas. No primeiro acesso o colaborador só troca a senha; sem essa troca, saldo e comprovante não abrem. A senha nova é definida na sessão dele. A empresa não lê essa senha. Se o acesso se perder, a empresa gera outra senha temporária: a anterior deixa de valer e as sessões abertas caem.

O login pede e-mail e senha. O papel sai do vínculo no banco: admin vai para a área da empresa, colaborador para a subconta. A tela de entrar não escolhe papel.

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

A lista do colaborador avisa os dois casos. O valor do aviso é o saldo da view. Saldo positivo pede a devolução à empresa. Saldo negativo mostra esse valor e o botão reembolsa exatamente ele, saindo do saldo da empresa.

Comprovante em análise não entra na fórmula. Comprovante recusado também não.

O app mostra, separados: transferido, em análise, baixado, saldo.

## Saldo da empresa

Em centavos, sempre derivado dos lançamentos de caixa. Não existe coluna de saldo editável.

```
saldo_empresa = entradas_manuais + devoluções − envios_aos_colaboradores
```

A entrada é o valor que o admin informa na conta da empresa. O envio é o adiantamento ou o reembolso que sai para a subconta.

- Sem saldo suficiente, o envio é recusado. Não nasce ordem, não debita a empresa e não credita o colaborador.
- O débito da empresa e o crédito da subconta nascem na mesma operação.
- A baixa não devolve valor à empresa: o colaborador já gastou.
- A devolução da sobra, quando for lançada, credita de volta o saldo da empresa.

## Transferência e reembolso

Os dois saem do saldo da empresa para a subconta do funcionário. Quem dispara é o admin. Este ciclo não envia Pix para o banco.

- Adiantamento aumenta a subconta e diminui o saldo da empresa.
- Reembolso faz o mesmo. Serve para cobrir saldo negativo da subconta.
- A chave Pix continua no cadastro. Não é digitada de novo a cada envio.

## Comprovante

O funcionário informa valor, categoria e foto.

Categorias: combustível, alimentação, pedágio, hospedagem, manutenção, insumos, frete, outros.

- Valor informado maior que zero.
- Foto obrigatória.
- Enquanto está em análise, o funcionário pode corrigir valor, categoria, observação e foto, ou excluir o comprovante. Na edição, excluir a foto continua disponível e exige outra no lugar. Isso não mexe no saldo. Depois da baixa, não edita e não apaga.
- No smartphone, a foto pode ficar na fila do aparelho e subir quando houver rede. No navegador, o envio é online.
- Estado inicial: em análise.

Fazenda, talhão ou placa são texto opcional neste ciclo. Cadastro próprio desses centros fica para depois.

## Baixa

Só o admin da mesma empresa, e só em comprovante ainda em análise. Na análise, o admin amplia a foto para conferir valor e detalhes.

O valor aceito é um número entre zero e o valor informado, inclusive.

| Valor aceito | Estado | Efeito no saldo |
|---|---|---|
| Igual ao informado | Aprovado | Abate esse valor |
| Entre zero e o informado | Parcial | Abate só o aceito |
| Zero | Recusado | Não abate |

A baixa acontece uma vez. O que não foi aceito não vira dívida automática: simplesmente não entra no saldo. Se ainda precisar comprovar, o funcionário envia outro comprovante.

A aba Comprovantes mostra a fila em análise e o histórico. Aprovado, parcial e recusado permanecem, com o valor informado e o valor aceito. No card do colaborador, envio da empresa, comprovante e devolução ficam em grupos separados. A baixa não vira uma segunda linha.

## Devolução da sobra

Quando o saldo da subconta está positivo, o admin devolve a sobra, no todo ou em parte. O valor fica entre 1 centavo e o saldo da subconta, inclusive. A operação diminui a subconta e credita o saldo da empresa na mesma hora. Sem sobra, ou acima dela, a devolução é recusada e nada muda.

## Lançamentos

Imutáveis. Cada um referencia a ordem de Pix, o comprovante ou a cobrança de devolução que o originou.

| Tipo | Quando nasce | Efeito |
|---|---|---|
| Adiantamento | Admin envia e o saldo da empresa cobre | Aumenta a subconta e diminui o saldo da empresa |
| Reembolso | Admin envia cobertura e o saldo da empresa cobre | Aumenta a subconta e diminui o saldo da empresa |
| Baixa | Admin aceita valor > 0 | Diminui o saldo |
| Devolução | Admin registra a sobra, até o saldo da subconta | Diminui a subconta e aumenta o saldo da empresa |

Recusa, ordem com falha e envio acima do saldo da empresa não geram lançamento.

## Conta da empresa

O saldo principal mora nos lançamentos de caixa da empresa. A entrada é manual. Não há gateway real neste ciclo e não há chave de API para conectar.

O dinheiro lançado aqui é controle interno do app. Cobrança da mensalidade do SaaS fica fora deste ciclo.

## Conferência antes de codar o banco

- Todo dado de negócio carrega a empresa.
- Funcionário lê só a própria subconta e os próprios comprovantes.
- Admin lê e age só na empresa dele.
- Cliente não grava lançamento direto. Baixa, comprovante e ordem de Pix passam por operação no servidor.
- O saldo da empresa e o da subconta mudam na mesma RPC de envio. Não há webhook neste ciclo.
- Valores em centavos, inteiros.
