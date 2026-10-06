/**
 * Lista atualizada de bancos e instituições de pagamento (IP) autorizados pelo BACEN (Banco Central do Brasil)
 * Fonte oficial: https://www.bcb.gov.br/content/estabilidadefinanceira/str1/ParticipantesSTR.csv
 * Filtrado exclusivamente para bancos de varejo e instituições voltadas a Pessoa Física (PF).
 * Padronizado em: CÓDIGO COMPE - Nome Extenso (em Title Case, exceto preposições e conjunções).
 */

export interface BacenBank {
  codigo: string;
  nome: string;
  label: string;
}

export const BACEN_PF_BANKS: BacenBank[] = [
  {
    "codigo": "001",
    "nome": "Banco do Brasil S.A.",
    "label": "001 - Banco do Brasil S.A."
  },
  {
    "codigo": "003",
    "nome": "Banco da Amazônia S.A.",
    "label": "003 - Banco da Amazônia S.A."
  },
  {
    "codigo": "004",
    "nome": "Banco do Nordeste do Brasil S.A.",
    "label": "004 - Banco do Nordeste do Brasil S.A."
  },
  {
    "codigo": "007",
    "nome": "Banco Nacional de Desenvolvimento Economico e Social",
    "label": "007 - Banco Nacional de Desenvolvimento Economico e Social"
  },
  {
    "codigo": "010",
    "nome": "Credicoamo Credito Rural Cooperativa",
    "label": "010 - Credicoamo Credito Rural Cooperativa"
  },
  {
    "codigo": "012",
    "nome": "Banco Inbursa S.A.",
    "label": "012 - Banco Inbursa S.A."
  },
  {
    "codigo": "014",
    "nome": "State Street Brasil S.A. - Banco Comercial",
    "label": "014 - State Street Brasil S.A. - Banco Comercial"
  },
  {
    "codigo": "016",
    "nome": "Cooperativa de Crédito Mútuo dos Despachantes de Trânsito de Santa Catarina e Rio Grande do Sul - Sicoob Creditran",
    "label": "016 - Cooperativa de Crédito Mútuo dos Despachantes de Trânsito de Santa Catarina e Rio Grande do Sul - Sicoob Creditran"
  },
  {
    "codigo": "017",
    "nome": "Bny Mellon Banco S.A.",
    "label": "017 - Bny Mellon Banco S.A."
  },
  {
    "codigo": "018",
    "nome": "Banco Tricury S.A.",
    "label": "018 - Banco Tricury S.A."
  },
  {
    "codigo": "021",
    "nome": "Banestes S.A. Banco do Estado do Espírito Santo",
    "label": "021 - Banestes S.A. Banco do Estado do Espírito Santo"
  },
  {
    "codigo": "023",
    "nome": "Conta Simples Sociedade de Crédito Direto S.A.",
    "label": "023 - Conta Simples Sociedade de Crédito Direto S.A."
  },
  {
    "codigo": "024",
    "nome": "Banco Bandepe S.A.",
    "label": "024 - Banco Bandepe S.A."
  },
  {
    "codigo": "025",
    "nome": "Banco Alfa S.A.",
    "label": "025 - Banco Alfa S.A."
  },
  {
    "codigo": "033",
    "nome": "Banco Santander (Brasil) S.A.",
    "label": "033 - Banco Santander (Brasil) S.A."
  },
  {
    "codigo": "036",
    "nome": "Banco Bradesco Bbi S.A.",
    "label": "036 - Banco Bradesco Bbi S.A."
  },
  {
    "codigo": "037",
    "nome": "Banco do Estado do Pará S.A.",
    "label": "037 - Banco do Estado do Pará S.A."
  },
  {
    "codigo": "040",
    "nome": "Banco Cargill S.A.",
    "label": "040 - Banco Cargill S.A."
  },
  {
    "codigo": "041",
    "nome": "Banrisul - Banco do Estado do Rio Grande do Sul S.A.",
    "label": "041 - Banrisul - Banco do Estado do Rio Grande do Sul S.A."
  },
  {
    "codigo": "047",
    "nome": "Banese - Banco do Estado de Sergipe S.A.",
    "label": "047 - Banese - Banco do Estado de Sergipe S.A."
  },
  {
    "codigo": "063",
    "nome": "Banco Bradescard S.A.",
    "label": "063 - Banco Bradescard S.A."
  },
  {
    "codigo": "064",
    "nome": "Goldman Sachs do Brasil Banco Multiplo S.A.",
    "label": "064 - Goldman Sachs do Brasil Banco Multiplo S.A."
  },
  {
    "codigo": "065",
    "nome": "Banco Andbank (brasil) S.A.",
    "label": "065 - Banco Andbank (brasil) S.A."
  },
  {
    "codigo": "066",
    "nome": "Banco Morgan Stanley S.A.",
    "label": "066 - Banco Morgan Stanley S.A."
  },
  {
    "codigo": "069",
    "nome": "Banco Crefisa S.A.",
    "label": "069 - Banco Crefisa S.A."
  },
  {
    "codigo": "070",
    "nome": "BRB - Banco de Brasília S.A.",
    "label": "070 - BRB - Banco de Brasília S.A."
  },
  {
    "codigo": "074",
    "nome": "Banco J. Safra S.A.",
    "label": "074 - Banco J. Safra S.A."
  },
  {
    "codigo": "075",
    "nome": "Banco Abn Amro Clearing S.A.",
    "label": "075 - Banco Abn Amro Clearing S.A."
  },
  {
    "codigo": "076",
    "nome": "Banco Kdb do Brasil S.A.",
    "label": "076 - Banco Kdb do Brasil S.A."
  },
  {
    "codigo": "077",
    "nome": "Banco Inter S.A.",
    "label": "077 - Banco Inter S.A."
  },
  {
    "codigo": "079",
    "nome": "Picpay Bank - Banco Múltiplo S.A.",
    "label": "079 - Picpay Bank - Banco Múltiplo S.A."
  },
  {
    "codigo": "081",
    "nome": "Bancoseguro S.A.",
    "label": "081 - Bancoseguro S.A."
  },
  {
    "codigo": "082",
    "nome": "Banco Topázio S.A.",
    "label": "082 - Banco Topázio S.A."
  },
  {
    "codigo": "083",
    "nome": "Banco da China Brasil S.A.",
    "label": "083 - Banco da China Brasil S.A."
  },
  {
    "codigo": "084",
    "nome": "Sisprime do Brasil - Cooperativa de Crédito",
    "label": "084 - Sisprime do Brasil - Cooperativa de Crédito"
  },
  {
    "codigo": "085",
    "nome": "Ailos (Cooperativa Central de Crédito)",
    "label": "085 - Ailos (Cooperativa Central de Crédito)"
  },
  {
    "codigo": "088",
    "nome": "Banco Randon S.A.",
    "label": "088 - Banco Randon S.A."
  },
  {
    "codigo": "089",
    "nome": "Credisan Cooperativa de Crédito",
    "label": "089 - Credisan Cooperativa de Crédito"
  },
  {
    "codigo": "093",
    "nome": "Pólocred Sociedade de Crédito Ao Microempreendedor e À Empresa de Pequeno Porte LTDA",
    "label": "093 - Pólocred Sociedade de Crédito Ao Microempreendedor e À Empresa de Pequeno Porte LTDA"
  },
  {
    "codigo": "094",
    "nome": "Banco Finaxis S.A.",
    "label": "094 - Banco Finaxis S.A."
  },
  {
    "codigo": "095",
    "nome": "Banco Travelex S.A.",
    "label": "095 - Banco Travelex S.A."
  },
  {
    "codigo": "097",
    "nome": "Credisis - Central de Cooperativas de Crédito",
    "label": "097 - Credisis - Central de Cooperativas de Crédito"
  },
  {
    "codigo": "099",
    "nome": "Uniprime Central Nacional - Central Nacional de Cooperativa de Credito",
    "label": "099 - Uniprime Central Nacional - Central Nacional de Cooperativa de Credito"
  },
  {
    "codigo": "104",
    "nome": "Caixa Econômica Federal",
    "label": "104 - Caixa Econômica Federal"
  },
  {
    "codigo": "107",
    "nome": "Banco Bocom Bbm S.A.",
    "label": "107 - Banco Bocom Bbm S.A."
  },
  {
    "codigo": "119",
    "nome": "Banco Western Union do Brasil S.A.",
    "label": "119 - Banco Western Union do Brasil S.A."
  },
  {
    "codigo": "120",
    "nome": "Banco Rodobens S.A.",
    "label": "120 - Banco Rodobens S.A."
  },
  {
    "codigo": "121",
    "nome": "Banco Agibank S.A.",
    "label": "121 - Banco Agibank S.A."
  },
  {
    "codigo": "122",
    "nome": "Banco Bradesco Berj S.A.",
    "label": "122 - Banco Bradesco Berj S.A."
  },
  {
    "codigo": "124",
    "nome": "Banco Woori Bank do Brasil S.A.",
    "label": "124 - Banco Woori Bank do Brasil S.A."
  },
  {
    "codigo": "125",
    "nome": "Banco Genial S.A.",
    "label": "125 - Banco Genial S.A."
  },
  {
    "codigo": "128",
    "nome": "Braza Bank S.A. Banco de Câmbio",
    "label": "128 - Braza Bank S.A. Banco de Câmbio"
  },
  {
    "codigo": "132",
    "nome": "Icbc do Brasil Banco Múltiplo S.A.",
    "label": "132 - Icbc do Brasil Banco Múltiplo S.A."
  },
  {
    "codigo": "133",
    "nome": "Confederação Nacional das Cooperativas Centrais de Crédito e Economia Familiar e Solidária - Cresol Confederação",
    "label": "133 - Confederação Nacional das Cooperativas Centrais de Crédito e Economia Familiar e Solidária - Cresol Confederação"
  },
  {
    "codigo": "136",
    "nome": "Unicred do Brasil",
    "label": "136 - Unicred do Brasil"
  },
  {
    "codigo": "139",
    "nome": "Intesa Sanpaolo Brasil S.A. - Banco Múltiplo",
    "label": "139 - Intesa Sanpaolo Brasil S.A. - Banco Múltiplo"
  },
  {
    "codigo": "143",
    "nome": "Intex Bank Banco de Câmbio S.A.",
    "label": "143 - Intex Bank Banco de Câmbio S.A."
  },
  {
    "codigo": "144",
    "nome": "Ebury Banco de Câmbio S.A.",
    "label": "144 - Ebury Banco de Câmbio S.A."
  },
  {
    "codigo": "159",
    "nome": "Casa do Crédito S.A. Sociedade de Crédito Ao Microempreendedor",
    "label": "159 - Casa do Crédito S.A. Sociedade de Crédito Ao Microempreendedor"
  },
  {
    "codigo": "183",
    "nome": "Socred S.A. - Sociedade de Crédito Ao Microempreendedor e À Empresa de Pequeno Porte",
    "label": "183 - Socred S.A. - Sociedade de Crédito Ao Microempreendedor e À Empresa de Pequeno Porte"
  },
  {
    "codigo": "190",
    "nome": "Servicoop - Cooperativa de Crédito dos Servidores Públicos Estaduais e Municipais do Rio Grande do Sul",
    "label": "190 - Servicoop - Cooperativa de Crédito dos Servidores Públicos Estaduais e Municipais do Rio Grande do Sul"
  },
  {
    "codigo": "197",
    "nome": "Stone Instituição de Pagamento S.A.",
    "label": "197 - Stone Instituição de Pagamento S.A."
  },
  {
    "codigo": "208",
    "nome": "Banco BTG Pactual S.A.",
    "label": "208 - Banco BTG Pactual S.A."
  },
  {
    "codigo": "212",
    "nome": "Banco Original S.A.",
    "label": "212 - Banco Original S.A."
  },
  {
    "codigo": "213",
    "nome": "Banco Arbi S.A.",
    "label": "213 - Banco Arbi S.A."
  },
  {
    "codigo": "217",
    "nome": "Banco John Deere S.A.",
    "label": "217 - Banco John Deere S.A."
  },
  {
    "codigo": "218",
    "nome": "Banco Bs2 S.A.",
    "label": "218 - Banco Bs2 S.A."
  },
  {
    "codigo": "222",
    "nome": "Banco Crédit Agricole Brasil S.A.",
    "label": "222 - Banco Crédit Agricole Brasil S.A."
  },
  {
    "codigo": "224",
    "nome": "Banco Fibra S.A.",
    "label": "224 - Banco Fibra S.A."
  },
  {
    "codigo": "233",
    "nome": "Banco Bmg Soluções Financeiras S.A.",
    "label": "233 - Banco Bmg Soluções Financeiras S.A."
  },
  {
    "codigo": "237",
    "nome": "Banco Bradesco S.A.",
    "label": "237 - Banco Bradesco S.A."
  },
  {
    "codigo": "241",
    "nome": "Banco Classico S.A.",
    "label": "241 - Banco Classico S.A."
  },
  {
    "codigo": "246",
    "nome": "Banco Abc Brasil S.A.",
    "label": "246 - Banco Abc Brasil S.A."
  },
  {
    "codigo": "249",
    "nome": "Banco Investcred Unibanco S.A.",
    "label": "249 - Banco Investcred Unibanco S.A."
  },
  {
    "codigo": "250",
    "nome": "Banco Bmg Consignado S.A.",
    "label": "250 - Banco Bmg Consignado S.A."
  },
  {
    "codigo": "254",
    "nome": "Paraná Banco S.A.",
    "label": "254 - Paraná Banco S.A."
  },
  {
    "codigo": "259",
    "nome": "Moneycorp Banco de Câmbio S.A.",
    "label": "259 - Moneycorp Banco de Câmbio S.A."
  },
  {
    "codigo": "260",
    "nome": "Nu Pagamentos S.A. (Nubank)",
    "label": "260 - Nu Pagamentos S.A. (Nubank)"
  },
  {
    "codigo": "265",
    "nome": "Banco Fator S.A.",
    "label": "265 - Banco Fator S.A."
  },
  {
    "codigo": "266",
    "nome": "Banco Cedula S.A.",
    "label": "266 - Banco Cedula S.A."
  },
  {
    "codigo": "268",
    "nome": "Bari Companhia Hipotecária",
    "label": "268 - Bari Companhia Hipotecária"
  },
  {
    "codigo": "269",
    "nome": "Banco Hsbc S.A.",
    "label": "269 - Banco Hsbc S.A."
  },
  {
    "codigo": "273",
    "nome": "Cooperativa de Credito Sulcredi Amplea",
    "label": "273 - Cooperativa de Credito Sulcredi Amplea"
  },
  {
    "codigo": "274",
    "nome": "Bmp Sociedade de Crédito Ao Microempreendedor e a Empresa de Pequeno Porte LTDA",
    "label": "274 - Bmp Sociedade de Crédito Ao Microempreendedor e a Empresa de Pequeno Porte LTDA"
  },
  {
    "codigo": "276",
    "nome": "Banco Senff S.A.",
    "label": "276 - Banco Senff S.A."
  },
  {
    "codigo": "281",
    "nome": "Cooperativa de Crédito Rural Coopavel",
    "label": "281 - Cooperativa de Crédito Rural Coopavel"
  },
  {
    "codigo": "290",
    "nome": "PagBank (PagSeguro Internet S.A.)",
    "label": "290 - PagBank (PagSeguro Internet S.A.)"
  },
  {
    "codigo": "299",
    "nome": "Banco Afinz S.A. - Banco Múltiplo",
    "label": "299 - Banco Afinz S.A. - Banco Múltiplo"
  },
  {
    "codigo": "300",
    "nome": "Banco de La Nacion Argentina",
    "label": "300 - Banco de La Nacion Argentina"
  },
  {
    "codigo": "301",
    "nome": "Dock Instituição de Pagamento S.A.",
    "label": "301 - Dock Instituição de Pagamento S.A."
  },
  {
    "codigo": "312",
    "nome": "Hscm - Sociedade de Crédito Ao Microempreendedor e À Empresa de Pequeno Porte LTDA",
    "label": "312 - Hscm - Sociedade de Crédito Ao Microempreendedor e À Empresa de Pequeno Porte LTDA"
  },
  {
    "codigo": "318",
    "nome": "Banco BMG S.A.",
    "label": "318 - Banco BMG S.A."
  },
  {
    "codigo": "320",
    "nome": "Bank Of China (brasil) Banco Múltiplo S.A.",
    "label": "320 - Bank Of China (brasil) Banco Múltiplo S.A."
  },
  {
    "codigo": "321",
    "nome": "Crefaz Sociedade de Crédito Ao Microempreendedor e a Empresa de Pequeno Porte S.A.",
    "label": "321 - Crefaz Sociedade de Crédito Ao Microempreendedor e a Empresa de Pequeno Porte S.A."
  },
  {
    "codigo": "322",
    "nome": "Cooperativa de Crédito Rural de Abelardo Luz - Sulcredi/crediluz",
    "label": "322 - Cooperativa de Crédito Rural de Abelardo Luz - Sulcredi/crediluz"
  },
  {
    "codigo": "323",
    "nome": "Mercado Pago Instituição de Pagamento LTDA",
    "label": "323 - Mercado Pago Instituição de Pagamento LTDA"
  },
  {
    "codigo": "324",
    "nome": "Cartos Sociedade de Crédito Direto S.A.",
    "label": "324 - Cartos Sociedade de Crédito Direto S.A."
  },
  {
    "codigo": "329",
    "nome": "Qi Sociedade de Crédito Direto S.A.",
    "label": "329 - Qi Sociedade de Crédito Direto S.A."
  },
  {
    "codigo": "332",
    "nome": "Acesso Soluções de Pagamento S.A. - Instituição de Pagamento",
    "label": "332 - Acesso Soluções de Pagamento S.A. - Instituição de Pagamento"
  },
  {
    "codigo": "334",
    "nome": "Banco Besa S.A.",
    "label": "334 - Banco Besa S.A."
  },
  {
    "codigo": "335",
    "nome": "Banco Digio S.A.",
    "label": "335 - Banco Digio S.A."
  },
  {
    "codigo": "336",
    "nome": "Banco C6 S.A.",
    "label": "336 - Banco C6 S.A."
  },
  {
    "codigo": "341",
    "nome": "Itaú Unibanco S.A.",
    "label": "341 - Itaú Unibanco S.A."
  },
  {
    "codigo": "342",
    "nome": "Creditas Sociedade de Crédito Direto S.A.",
    "label": "342 - Creditas Sociedade de Crédito Direto S.A."
  },
  {
    "codigo": "348",
    "nome": "Banco Xp S.A.",
    "label": "348 - Banco Xp S.A."
  },
  {
    "codigo": "350",
    "nome": "Cooperativa de Crédito Popular do Brasil - Crehnor",
    "label": "350 - Cooperativa de Crédito Popular do Brasil - Crehnor"
  },
  {
    "codigo": "355",
    "nome": "Ótimo Sociedade de Crédito Direto S.A.",
    "label": "355 - Ótimo Sociedade de Crédito Direto S.A."
  },
  {
    "codigo": "362",
    "nome": "Cielo S.A. - Instituição de Pagamento",
    "label": "362 - Cielo S.A. - Instituição de Pagamento"
  },
  {
    "codigo": "364",
    "nome": "Efí S.A. - Instituição de Pagamento",
    "label": "364 - Efí S.A. - Instituição de Pagamento"
  },
  {
    "codigo": "366",
    "nome": "Banco Societe Generale Brasil S.A.",
    "label": "366 - Banco Societe Generale Brasil S.A."
  },
  {
    "codigo": "368",
    "nome": "Banco Csf S.A.",
    "label": "368 - Banco Csf S.A."
  },
  {
    "codigo": "370",
    "nome": "Banco Mizuho do Brasil S.A.",
    "label": "370 - Banco Mizuho do Brasil S.A."
  },
  {
    "codigo": "373",
    "nome": "Up.p Sociedade de Empréstimo Entre Pessoas S.A.",
    "label": "373 - Up.p Sociedade de Empréstimo Entre Pessoas S.A."
  },
  {
    "codigo": "376",
    "nome": "Banco J.p. Morgan S.A.",
    "label": "376 - Banco J.p. Morgan S.A."
  },
  {
    "codigo": "377",
    "nome": "Bms Sociedade de Crédito Direto S.A.",
    "label": "377 - Bms Sociedade de Crédito Direto S.A."
  },
  {
    "codigo": "378",
    "nome": "Banco Brasileiro de Crédito Sociedade Anônima",
    "label": "378 - Banco Brasileiro de Crédito Sociedade Anônima"
  },
  {
    "codigo": "380",
    "nome": "PicPay Instituição de Pagamento S.A.",
    "label": "380 - PicPay Instituição de Pagamento S.A."
  },
  {
    "codigo": "381",
    "nome": "Banco Mercedes-benz do Brasil S.A.",
    "label": "381 - Banco Mercedes-benz do Brasil S.A."
  },
  {
    "codigo": "382",
    "nome": "Fidúcia Sociedade de Crédito Ao Microempreendedor e À Empresa de Pequeno Porte Limitada.",
    "label": "382 - Fidúcia Sociedade de Crédito Ao Microempreendedor e À Empresa de Pequeno Porte Limitada."
  },
  {
    "codigo": "383",
    "nome": "Ebanx Instituicao de Pagamentos LTDA",
    "label": "383 - Ebanx Instituicao de Pagamentos LTDA"
  },
  {
    "codigo": "384",
    "nome": "Global Finanças Sociedade de Crédito Ao Microempreendedor e À Empresa de Pequeno Porte LTDA",
    "label": "384 - Global Finanças Sociedade de Crédito Ao Microempreendedor e À Empresa de Pequeno Porte LTDA"
  },
  {
    "codigo": "385",
    "nome": "Cooperativa de Economia e Credito Mutuo dos Trabalhadores Portuarios da Grande Vitoria - Credestiva.",
    "label": "385 - Cooperativa de Economia e Credito Mutuo dos Trabalhadores Portuarios da Grande Vitoria - Credestiva."
  },
  {
    "codigo": "387",
    "nome": "Banco Toyota do Brasil S.A.",
    "label": "387 - Banco Toyota do Brasil S.A."
  },
  {
    "codigo": "389",
    "nome": "Banco Mercantil do Brasil S.A.",
    "label": "389 - Banco Mercantil do Brasil S.A."
  },
  {
    "codigo": "390",
    "nome": "Banco Gm S.A.",
    "label": "390 - Banco Gm S.A."
  },
  {
    "codigo": "391",
    "nome": "Cooperativa de Credito Rural de Ibiam - Sulcredi/ibiam",
    "label": "391 - Cooperativa de Credito Rural de Ibiam - Sulcredi/ibiam"
  },
  {
    "codigo": "393",
    "nome": "Banco Volkswagen S.A.",
    "label": "393 - Banco Volkswagen S.A."
  },
  {
    "codigo": "394",
    "nome": "Banco Bradesco Financiamentos S.A.",
    "label": "394 - Banco Bradesco Financiamentos S.A."
  },
  {
    "codigo": "396",
    "nome": "Magalupay Instituição de Pagamento S.A.",
    "label": "396 - Magalupay Instituição de Pagamento S.A."
  },
  {
    "codigo": "397",
    "nome": "Listo Sociedade de Credito Direto S.A.",
    "label": "397 - Listo Sociedade de Credito Direto S.A."
  },
  {
    "codigo": "399",
    "nome": "Kirton Bank S.A. - Banco Múltiplo",
    "label": "399 - Kirton Bank S.A. - Banco Múltiplo"
  },
  {
    "codigo": "401",
    "nome": "Iugu Instituição de Pagamento S.A.",
    "label": "401 - Iugu Instituição de Pagamento S.A."
  },
  {
    "codigo": "406",
    "nome": "Accredito - Sociedade de Crédito Direto S.A.",
    "label": "406 - Accredito - Sociedade de Crédito Direto S.A."
  },
  {
    "codigo": "408",
    "nome": "Bonuspago Sociedade de Crédito Direto S.A.",
    "label": "408 - Bonuspago Sociedade de Crédito Direto S.A."
  },
  {
    "codigo": "410",
    "nome": "Planner Sociedade de Crédito Direto S.A.",
    "label": "410 - Planner Sociedade de Crédito Direto S.A."
  },
  {
    "codigo": "412",
    "nome": "Social Bank Banco Múltiplo S.A.",
    "label": "412 - Social Bank Banco Múltiplo S.A."
  },
  {
    "codigo": "413",
    "nome": "Banco Bv S.A.",
    "label": "413 - Banco Bv S.A."
  },
  {
    "codigo": "414",
    "nome": "Lend Sociedade de Crédito Direto S.A.",
    "label": "414 - Lend Sociedade de Crédito Direto S.A."
  },
  {
    "codigo": "415",
    "nome": "Banco Nacional S.A.",
    "label": "415 - Banco Nacional S.A."
  },
  {
    "codigo": "416",
    "nome": "Lamara Sociedade de Crédito Direto S.A.",
    "label": "416 - Lamara Sociedade de Crédito Direto S.A."
  },
  {
    "codigo": "418",
    "nome": "Zipdin Soluções Digitais Sociedade de Crédito Direto S.A.",
    "label": "418 - Zipdin Soluções Digitais Sociedade de Crédito Direto S.A."
  },
  {
    "codigo": "419",
    "nome": "Numbrs Sociedade de Crédito Direto S.A.",
    "label": "419 - Numbrs Sociedade de Crédito Direto S.A."
  },
  {
    "codigo": "421",
    "nome": "Lar Cooperativa de Crédito - Lar Credi",
    "label": "421 - Lar Cooperativa de Crédito - Lar Credi"
  },
  {
    "codigo": "422",
    "nome": "Banco Safra S.A.",
    "label": "422 - Banco Safra S.A."
  },
  {
    "codigo": "427",
    "nome": "Cooperativa de Crédito dos Servidores da Universidade Federal do Espirito Santo",
    "label": "427 - Cooperativa de Crédito dos Servidores da Universidade Federal do Espirito Santo"
  },
  {
    "codigo": "428",
    "nome": "Credsystem Sociedade de Crédito Direto S.A.",
    "label": "428 - Credsystem Sociedade de Crédito Direto S.A."
  },
  {
    "codigo": "430",
    "nome": "Cooperativa de Credito Rural Seara - Crediseara",
    "label": "430 - Cooperativa de Credito Rural Seara - Crediseara"
  },
  {
    "codigo": "435",
    "nome": "Delfinance Sociedade de Credito Direto S.A.",
    "label": "435 - Delfinance Sociedade de Credito Direto S.A."
  },
  {
    "codigo": "444",
    "nome": "Trinus Sociedade de Crédito Direto S.A.",
    "label": "444 - Trinus Sociedade de Crédito Direto S.A."
  },
  {
    "codigo": "449",
    "nome": "Dm Sociedade de Crédito Direto S.A.",
    "label": "449 - Dm Sociedade de Crédito Direto S.A."
  },
  {
    "codigo": "450",
    "nome": "Fits Instituição de Pagamento S.A.",
    "label": "450 - Fits Instituição de Pagamento S.A."
  },
  {
    "codigo": "451",
    "nome": "J17 - Sociedade de Crédito Direto S.A.",
    "label": "451 - J17 - Sociedade de Crédito Direto S.A."
  },
  {
    "codigo": "452",
    "nome": "Credifit Sociedade de Crédito Direto S.A.",
    "label": "452 - Credifit Sociedade de Crédito Direto S.A."
  },
  {
    "codigo": "456",
    "nome": "Banco Mufg Brasil S.A.",
    "label": "456 - Banco Mufg Brasil S.A."
  },
  {
    "codigo": "457",
    "nome": "Uy3 Sociedade de Crédito Direto S.A.",
    "label": "457 - Uy3 Sociedade de Crédito Direto S.A."
  },
  {
    "codigo": "460",
    "nome": "Unavanti Sociedade de Crédito Direto S.A.",
    "label": "460 - Unavanti Sociedade de Crédito Direto S.A."
  },
  {
    "codigo": "461",
    "nome": "Asaas Gestão Financeira Instituição de Pagamento S.A.",
    "label": "461 - Asaas Gestão Financeira Instituição de Pagamento S.A."
  },
  {
    "codigo": "462",
    "nome": "Stark Sociedade de Crédito Direto S.A.",
    "label": "462 - Stark Sociedade de Crédito Direto S.A."
  },
  {
    "codigo": "464",
    "nome": "Banco Sumitomo Mitsui Brasileiro S.A.",
    "label": "464 - Banco Sumitomo Mitsui Brasileiro S.A."
  },
  {
    "codigo": "465",
    "nome": "Capital Consig Sociedade de Crédito Direto S.A.",
    "label": "465 - Capital Consig Sociedade de Crédito Direto S.A."
  },
  {
    "codigo": "470",
    "nome": "Cdc Sociedade de Crédito Direto S.A.",
    "label": "470 - Cdc Sociedade de Crédito Direto S.A."
  },
  {
    "codigo": "473",
    "nome": "Banco Caixa Geral - Brasil S.A.",
    "label": "473 - Banco Caixa Geral - Brasil S.A."
  },
  {
    "codigo": "475",
    "nome": "Banco Yamaha Motor do Brasil S.A.",
    "label": "475 - Banco Yamaha Motor do Brasil S.A."
  },
  {
    "codigo": "476",
    "nome": "Idea Maker Instituicao de Pagamento LTDA",
    "label": "476 - Idea Maker Instituicao de Pagamento LTDA"
  },
  {
    "codigo": "477",
    "nome": "Citibank N.a.",
    "label": "477 - Citibank N.a."
  },
  {
    "codigo": "479",
    "nome": "Banco Itaubank S.A.",
    "label": "479 - Banco Itaubank S.A."
  },
  {
    "codigo": "481",
    "nome": "Superlógica Sociedade de Crédito Direto S.A.",
    "label": "481 - Superlógica Sociedade de Crédito Direto S.A."
  },
  {
    "codigo": "482",
    "nome": "Artta Sociedade de Crédito Direto S.A.",
    "label": "482 - Artta Sociedade de Crédito Direto S.A."
  },
  {
    "codigo": "487",
    "nome": "Deutsche Bank S.A. - Banco Alemao",
    "label": "487 - Deutsche Bank S.A. - Banco Alemao"
  },
  {
    "codigo": "488",
    "nome": "Jpmorgan Chase Bank, National Association",
    "label": "488 - Jpmorgan Chase Bank, National Association"
  },
  {
    "codigo": "495",
    "nome": "Banco de La Provincia de Buenos Aires",
    "label": "495 - Banco de La Provincia de Buenos Aires"
  },
  {
    "codigo": "505",
    "nome": "Banco Ubs (brasil) S.A.",
    "label": "505 - Banco Ubs (brasil) S.A."
  },
  {
    "codigo": "509",
    "nome": "Celcoin Instituicao de Pagamento S.A.",
    "label": "509 - Celcoin Instituicao de Pagamento S.A."
  },
  {
    "codigo": "510",
    "nome": "Ffcred Sociedade de Crédito Direto S.a..",
    "label": "510 - Ffcred Sociedade de Crédito Direto S.a.."
  },
  {
    "codigo": "511",
    "nome": "Magnum Sociedade de Crédito Direto S.A.",
    "label": "511 - Magnum Sociedade de Crédito Direto S.A."
  },
  {
    "codigo": "513",
    "nome": "Atf Sociedade de Crédito Direto S.A.",
    "label": "513 - Atf Sociedade de Crédito Direto S.A."
  },
  {
    "codigo": "517",
    "nome": "Pagueveloz Instituição de Pagamento LTDA",
    "label": "517 - Pagueveloz Instituição de Pagamento LTDA"
  },
  {
    "codigo": "520",
    "nome": "Somapay Sociedade de Crédito Direto S.A.",
    "label": "520 - Somapay Sociedade de Crédito Direto S.A."
  },
  {
    "codigo": "521",
    "nome": "Peak Sociedade de Empréstimo Entre Pessoas S.A.",
    "label": "521 - Peak Sociedade de Empréstimo Entre Pessoas S.A."
  },
  {
    "codigo": "522",
    "nome": "Red Sociedade de Crédito Direto S.A.",
    "label": "522 - Red Sociedade de Crédito Direto S.A."
  },
  {
    "codigo": "523",
    "nome": "Hr Digital - Sociedade de Crédito Direto S.A.",
    "label": "523 - Hr Digital - Sociedade de Crédito Direto S.A."
  },
  {
    "codigo": "526",
    "nome": "Monetarie Sociedade de Crédito Direto S.A.",
    "label": "526 - Monetarie Sociedade de Crédito Direto S.A."
  },
  {
    "codigo": "527",
    "nome": "Aticca - Sociedade de Crédito Direto S.A.",
    "label": "527 - Aticca - Sociedade de Crédito Direto S.A."
  },
  {
    "codigo": "529",
    "nome": "Pinbank Brasil Instituição de Pagamento S.A.",
    "label": "529 - Pinbank Brasil Instituição de Pagamento S.A."
  },
  {
    "codigo": "530",
    "nome": "Ser Finance Sociedade de Crédito Direto S.A.",
    "label": "530 - Ser Finance Sociedade de Crédito Direto S.A."
  },
  {
    "codigo": "531",
    "nome": "Bmp Sociedade de Crédito Direto S.A.",
    "label": "531 - Bmp Sociedade de Crédito Direto S.A."
  },
  {
    "codigo": "532",
    "nome": "Futuro Sociedade de Crédito Direto S.A.",
    "label": "532 - Futuro Sociedade de Crédito Direto S.A."
  },
  {
    "codigo": "533",
    "nome": "Srm Bank Instituição de Pagamento S.A.",
    "label": "533 - Srm Bank Instituição de Pagamento S.A."
  },
  {
    "codigo": "534",
    "nome": "Ewally Instituição de Pagamento S.A.",
    "label": "534 - Ewally Instituição de Pagamento S.A."
  },
  {
    "codigo": "535",
    "nome": "Opea Sociedade de Crédito Direto S.A.",
    "label": "535 - Opea Sociedade de Crédito Direto S.A."
  },
  {
    "codigo": "536",
    "nome": "Neon Pagamentos S.A. - Instituição de Pagamento",
    "label": "536 - Neon Pagamentos S.A. - Instituição de Pagamento"
  },
  {
    "codigo": "537",
    "nome": "Select Credit Sociedade de Crédito Ao Microempreendedor e À Empresa de Pequeno Porte LTDA",
    "label": "537 - Select Credit Sociedade de Crédito Ao Microempreendedor e À Empresa de Pequeno Porte LTDA"
  },
  {
    "codigo": "538",
    "nome": "Sudacred Sociedade de Crédito Direto S.A.",
    "label": "538 - Sudacred Sociedade de Crédito Direto S.A."
  },
  {
    "codigo": "540",
    "nome": "Hbi Sociedade de Crédito Direto S/a.",
    "label": "540 - Hbi Sociedade de Crédito Direto S/a."
  },
  {
    "codigo": "542",
    "nome": "Cloudwalk Instituição de Pagamento e Servicos LTDA",
    "label": "542 - Cloudwalk Instituição de Pagamento e Servicos LTDA"
  },
  {
    "codigo": "543",
    "nome": "Cooperativa de Economia e Crédito Mútuo dos Eletricitários e dos Trabalhadores das Empresas do Setor de Energia - Coopcrece",
    "label": "543 - Cooperativa de Economia e Crédito Mútuo dos Eletricitários e dos Trabalhadores das Empresas do Setor de Energia - Coopcrece"
  },
  {
    "codigo": "544",
    "nome": "Multicred Sociedade de Crédito Direto S.A.",
    "label": "544 - Multicred Sociedade de Crédito Direto S.A."
  },
  {
    "codigo": "546",
    "nome": "Okto Instituição de Pagamento S.A.",
    "label": "546 - Okto Instituição de Pagamento S.A."
  },
  {
    "codigo": "547",
    "nome": "Bnk Digital Sociedade de Crédito Direto S.A.",
    "label": "547 - Bnk Digital Sociedade de Crédito Direto S.A."
  },
  {
    "codigo": "550",
    "nome": "Beeteller Instituição de Pagamento LTDA",
    "label": "550 - Beeteller Instituição de Pagamento LTDA"
  },
  {
    "codigo": "552",
    "nome": "Uzzipay Instituição de Pagamento S.A.",
    "label": "552 - Uzzipay Instituição de Pagamento S.A."
  },
  {
    "codigo": "553",
    "nome": "Percapital Sociedade de Crédito Direto S.A.",
    "label": "553 - Percapital Sociedade de Crédito Direto S.A."
  },
  {
    "codigo": "554",
    "nome": "Banco Stonex S.A.",
    "label": "554 - Banco Stonex S.A."
  },
  {
    "codigo": "557",
    "nome": "Pagprime Instituicao de Pagamento LTDA",
    "label": "557 - Pagprime Instituicao de Pagamento LTDA"
  },
  {
    "codigo": "560",
    "nome": "Mag Instituicao de Pagamento LTDA",
    "label": "560 - Mag Instituicao de Pagamento LTDA"
  },
  {
    "codigo": "561",
    "nome": "Pay4fun Instituicao de Pagamento S.A.",
    "label": "561 - Pay4fun Instituicao de Pagamento S.A."
  },
  {
    "codigo": "563",
    "nome": "Protege Cash Instituição de Pagamento S.A.",
    "label": "563 - Protege Cash Instituição de Pagamento S.A."
  },
  {
    "codigo": "566",
    "nome": "Flagship Instituicao de Pagamento LTDA",
    "label": "566 - Flagship Instituicao de Pagamento LTDA"
  },
  {
    "codigo": "569",
    "nome": "Conta Pronta Instituicao de Pagamento LTDA",
    "label": "569 - Conta Pronta Instituicao de Pagamento LTDA"
  },
  {
    "codigo": "572",
    "nome": "All In Cred Sociedade de Credito Direto S.A.",
    "label": "572 - All In Cred Sociedade de Credito Direto S.A."
  },
  {
    "codigo": "573",
    "nome": "Oxy Companhia Hipotecária",
    "label": "573 - Oxy Companhia Hipotecária"
  },
  {
    "codigo": "574",
    "nome": "A55 Sociedade de Crédito Direto S.A.",
    "label": "574 - A55 Sociedade de Crédito Direto S.A."
  },
  {
    "codigo": "575",
    "nome": "Dgbk Credit S.A. - Sociedade de Crédito Direto.",
    "label": "575 - Dgbk Credit S.A. - Sociedade de Crédito Direto."
  },
  {
    "codigo": "576",
    "nome": "Mercado Bitcoin Instituicao de Pagamento LTDA",
    "label": "576 - Mercado Bitcoin Instituicao de Pagamento LTDA"
  },
  {
    "codigo": "577",
    "nome": "Desenvolve Sp - Agência de Fomento do Estado de São Paulo S.A.",
    "label": "577 - Desenvolve Sp - Agência de Fomento do Estado de São Paulo S.A."
  },
  {
    "codigo": "579",
    "nome": "Quadra Sociedade de Crédito Direto S.A.",
    "label": "579 - Quadra Sociedade de Crédito Direto S.A."
  },
  {
    "codigo": "585",
    "nome": "Sethi Sociedade de Crédito Direto S.A.",
    "label": "585 - Sethi Sociedade de Crédito Direto S.A."
  },
  {
    "codigo": "586",
    "nome": "Z1 Instituição de Pagamento LTDA",
    "label": "586 - Z1 Instituição de Pagamento LTDA"
  },
  {
    "codigo": "588",
    "nome": "Avancard Prover Instituição de Pagamento LTDA",
    "label": "588 - Avancard Prover Instituição de Pagamento LTDA"
  },
  {
    "codigo": "589",
    "nome": "G5 Sociedade de Crédito Direto S.A.",
    "label": "589 - G5 Sociedade de Crédito Direto S.A."
  },
  {
    "codigo": "590",
    "nome": "Repasses Financeiros e Solucoes Tecnologicas Instituicao de Pagamento S.A.",
    "label": "590 - Repasses Financeiros e Solucoes Tecnologicas Instituicao de Pagamento S.A."
  },
  {
    "codigo": "592",
    "nome": "Instituição de Pagamentos Maps LTDA",
    "label": "592 - Instituição de Pagamentos Maps LTDA"
  },
  {
    "codigo": "593",
    "nome": "Transfeera Instituição de Pagamento S.A.",
    "label": "593 - Transfeera Instituição de Pagamento S.A."
  },
  {
    "codigo": "595",
    "nome": "Ifood Pago Instituição de Pagamento S.A.",
    "label": "595 - Ifood Pago Instituição de Pagamento S.A."
  },
  {
    "codigo": "596",
    "nome": "Cactvs Instituicao de Pagamento S.A.",
    "label": "596 - Cactvs Instituicao de Pagamento S.A."
  },
  {
    "codigo": "597",
    "nome": "Issuer Instituicao de Pagamento LTDA",
    "label": "597 - Issuer Instituicao de Pagamento LTDA"
  },
  {
    "codigo": "598",
    "nome": "Konect Sociedade de Crédito Direto S.A.",
    "label": "598 - Konect Sociedade de Crédito Direto S.A."
  },
  {
    "codigo": "600",
    "nome": "Banco Luso Brasileiro S.A.",
    "label": "600 - Banco Luso Brasileiro S.A."
  },
  {
    "codigo": "604",
    "nome": "Banco Industrial do Brasil S.A.",
    "label": "604 - Banco Industrial do Brasil S.A."
  },
  {
    "codigo": "610",
    "nome": "Banco Vr S.A.",
    "label": "610 - Banco Vr S.A."
  },
  {
    "codigo": "611",
    "nome": "Banco Paulista S.A.",
    "label": "611 - Banco Paulista S.A."
  },
  {
    "codigo": "612",
    "nome": "Banco Guanabara S.A.",
    "label": "612 - Banco Guanabara S.A."
  },
  {
    "codigo": "613",
    "nome": "Omni Banco S.A.",
    "label": "613 - Omni Banco S.A."
  },
  {
    "codigo": "614",
    "nome": "Sants Sociedade de Crédito Direto S.A.",
    "label": "614 - Sants Sociedade de Crédito Direto S.A."
  },
  {
    "codigo": "615",
    "nome": "Smart Solutions Group Instituicao de Pagamento LTDA",
    "label": "615 - Smart Solutions Group Instituicao de Pagamento LTDA"
  },
  {
    "codigo": "619",
    "nome": "Trio Instituicao de Pagamento LTDA",
    "label": "619 - Trio Instituicao de Pagamento LTDA"
  },
  {
    "codigo": "620",
    "nome": "Revolut Sociedade de Crédito Direto S.A.",
    "label": "620 - Revolut Sociedade de Crédito Direto S.A."
  },
  {
    "codigo": "623",
    "nome": "Banco PAN S.A.",
    "label": "623 - Banco PAN S.A."
  },
  {
    "codigo": "626",
    "nome": "Banco C6 Consignado S.A.",
    "label": "626 - Banco C6 Consignado S.A."
  },
  {
    "codigo": "632",
    "nome": "Z-on Sociedade de Crédito Direto S.A.",
    "label": "632 - Z-on Sociedade de Crédito Direto S.A."
  },
  {
    "codigo": "633",
    "nome": "Banco Rendimento S.A.",
    "label": "633 - Banco Rendimento S.A."
  },
  {
    "codigo": "634",
    "nome": "Banco Triangulo S.A.",
    "label": "634 - Banco Triangulo S.A."
  },
  {
    "codigo": "636",
    "nome": "Giro - Sociedade de Crédito Direto S.A.",
    "label": "636 - Giro - Sociedade de Crédito Direto S.A."
  },
  {
    "codigo": "637",
    "nome": "Banco Sofisa S.A.",
    "label": "637 - Banco Sofisa S.A."
  },
  {
    "codigo": "643",
    "nome": "Banco Pine S.A.",
    "label": "643 - Banco Pine S.A."
  },
  {
    "codigo": "644",
    "nome": "321 Sociedade de Crédito Direto S.A.",
    "label": "644 - 321 Sociedade de Crédito Direto S.A."
  },
  {
    "codigo": "651",
    "nome": "Pagare Instituicao de Pagamento S.A.",
    "label": "651 - Pagare Instituicao de Pagamento S.A."
  },
  {
    "codigo": "654",
    "nome": "Banco Digimais S.A.",
    "label": "654 - Banco Digimais S.A."
  },
  {
    "codigo": "655",
    "nome": "Banco Votorantim S.A. (BV)",
    "label": "655 - Banco Votorantim S.A. (BV)"
  },
  {
    "codigo": "659",
    "nome": "Onekey Payments Instituicao de Pagamento S.A.",
    "label": "659 - Onekey Payments Instituicao de Pagamento S.A."
  },
  {
    "codigo": "660",
    "nome": "Pagme Instituição de Pagamento LTDA",
    "label": "660 - Pagme Instituição de Pagamento LTDA"
  },
  {
    "codigo": "662",
    "nome": "We Pay Out Instituicao de Pagamento LTDA",
    "label": "662 - We Pay Out Instituicao de Pagamento LTDA"
  },
  {
    "codigo": "665",
    "nome": "Stark Bank S.A. - Instituicao de Pagamento",
    "label": "665 - Stark Bank S.A. - Instituicao de Pagamento"
  },
  {
    "codigo": "668",
    "nome": "Celcoin Sociedade de Crédito Direto S.A.",
    "label": "668 - Celcoin Sociedade de Crédito Direto S.A."
  },
  {
    "codigo": "669",
    "nome": "Transfero Instituicao de Pagamento LTDA",
    "label": "669 - Transfero Instituicao de Pagamento LTDA"
  },
  {
    "codigo": "670",
    "nome": "Bsn Pagamentos Instituição de Pagamento LTDA",
    "label": "670 - Bsn Pagamentos Instituição de Pagamento LTDA"
  },
  {
    "codigo": "671",
    "nome": "Zero Instituição de Pagamento S.A.",
    "label": "671 - Zero Instituição de Pagamento S.A."
  },
  {
    "codigo": "673",
    "nome": "Cooperativa de Crédito Rural do Agreste Alagoano - Cooperagre",
    "label": "673 - Cooperativa de Crédito Rural do Agreste Alagoano - Cooperagre"
  },
  {
    "codigo": "674",
    "nome": "Hinova Pay Instituicao de Pagamento S.A.",
    "label": "674 - Hinova Pay Instituicao de Pagamento S.A."
  },
  {
    "codigo": "675",
    "nome": "Casas Bahia Pay Instituição de Pagamento LTDA",
    "label": "675 - Casas Bahia Pay Instituição de Pagamento LTDA"
  },
  {
    "codigo": "677",
    "nome": "Gowd Instituição de Pagamento LTDA",
    "label": "677 - Gowd Instituição de Pagamento LTDA"
  },
  {
    "codigo": "678",
    "nome": "Fidem Sociedade de Crédito Direto S.A.",
    "label": "678 - Fidem Sociedade de Crédito Direto S.A."
  },
  {
    "codigo": "679",
    "nome": "Pay Instituicao de Pagamento S.A.",
    "label": "679 - Pay Instituicao de Pagamento S.A."
  },
  {
    "codigo": "680",
    "nome": "Delta Global Sociedade de Crédito Direto S.A.",
    "label": "680 - Delta Global Sociedade de Crédito Direto S.A."
  },
  {
    "codigo": "681",
    "nome": "Mt Instituicao de Pagamento S.A.",
    "label": "681 - Mt Instituicao de Pagamento S.A."
  },
  {
    "codigo": "682",
    "nome": "Monery Instituicao de Pagamento S.A.",
    "label": "682 - Monery Instituicao de Pagamento S.A."
  },
  {
    "codigo": "683",
    "nome": "Brasil Cash Instituicao de Pagamento S.A.",
    "label": "683 - Brasil Cash Instituicao de Pagamento S.A."
  },
  {
    "codigo": "685",
    "nome": "Tycoon Technology Instituicao de Pagamento S.A.",
    "label": "685 - Tycoon Technology Instituicao de Pagamento S.A."
  },
  {
    "codigo": "686",
    "nome": "Biz Instituição de Pagamento S.A.",
    "label": "686 - Biz Instituição de Pagamento S.A."
  },
  {
    "codigo": "687",
    "nome": "Inco Sociedade de Empréstimo Entre Pessoas S.A.",
    "label": "687 - Inco Sociedade de Empréstimo Entre Pessoas S.A."
  },
  {
    "codigo": "688",
    "nome": "Kikai Sociedade de Crédito Direto S.A.",
    "label": "688 - Kikai Sociedade de Crédito Direto S.A."
  },
  {
    "codigo": "690",
    "nome": "Bk Instituição de Pagamento S.A.",
    "label": "690 - Bk Instituição de Pagamento S.A."
  },
  {
    "codigo": "691",
    "nome": "Wasu - Wallet Support Instituição de Pagamento LTDA",
    "label": "691 - Wasu - Wallet Support Instituição de Pagamento LTDA"
  },
  {
    "codigo": "692",
    "nome": "Zydi Sociedade de Crédito Direto S.A.",
    "label": "692 - Zydi Sociedade de Crédito Direto S.A."
  },
  {
    "codigo": "693",
    "nome": "Efex Instituição de Pagamento S.A.",
    "label": "693 - Efex Instituição de Pagamento S.A."
  },
  {
    "codigo": "694",
    "nome": "Woovi Instituicao de Pagamento LTDA",
    "label": "694 - Woovi Instituicao de Pagamento LTDA"
  },
  {
    "codigo": "695",
    "nome": "Bees Instituicao de Pagamento LTDA",
    "label": "695 - Bees Instituicao de Pagamento LTDA"
  },
  {
    "codigo": "696",
    "nome": "Loan Brasil Sociedade de Crédito Direto S.A.",
    "label": "696 - Loan Brasil Sociedade de Crédito Direto S.A."
  },
  {
    "codigo": "698",
    "nome": "Bit Sociedade de Crédito Direto S.A.",
    "label": "698 - Bit Sociedade de Crédito Direto S.A."
  },
  {
    "codigo": "699",
    "nome": "Bfc Sociedade de Crédito Direto S.A.",
    "label": "699 - Bfc Sociedade de Crédito Direto S.A."
  },
  {
    "codigo": "700",
    "nome": "Mw Instituicao de Pagamento LTDA",
    "label": "700 - Mw Instituicao de Pagamento LTDA"
  },
  {
    "codigo": "701",
    "nome": "Integração de Crédito e Cobrança Sociedade de Crédito Direto S.A.",
    "label": "701 - Integração de Crédito e Cobrança Sociedade de Crédito Direto S.A."
  },
  {
    "codigo": "703",
    "nome": "Getnet Adquirência e Serviços para Meios de Pagamento S.A. Instituição de Pagamento",
    "label": "703 - Getnet Adquirência e Serviços para Meios de Pagamento S.A. Instituição de Pagamento"
  },
  {
    "codigo": "704",
    "nome": "Festor Instituição de Pagamento LTDA",
    "label": "704 - Festor Instituição de Pagamento LTDA"
  },
  {
    "codigo": "707",
    "nome": "Banco Daycoval S.A.",
    "label": "707 - Banco Daycoval S.A."
  },
  {
    "codigo": "712",
    "nome": "Ouribank S.A. Banco Múltiplo",
    "label": "712 - Ouribank S.A. Banco Múltiplo"
  },
  {
    "codigo": "741",
    "nome": "Banco Ribeirao Preto S.A.",
    "label": "741 - Banco Ribeirao Preto S.A."
  },
  {
    "codigo": "743",
    "nome": "Banco Semear S.A.",
    "label": "743 - Banco Semear S.A."
  },
  {
    "codigo": "745",
    "nome": "Banco Citibank S.A.",
    "label": "745 - Banco Citibank S.A."
  },
  {
    "codigo": "747",
    "nome": "Banco Rabobank International Brasil S.A.",
    "label": "747 - Banco Rabobank International Brasil S.A."
  },
  {
    "codigo": "748",
    "nome": "Banco Cooperativo Sicredi S.A.",
    "label": "748 - Banco Cooperativo Sicredi S.A."
  },
  {
    "codigo": "751",
    "nome": "Scotiabank Brasil S.A. Banco Múltiplo",
    "label": "751 - Scotiabank Brasil S.A. Banco Múltiplo"
  },
  {
    "codigo": "752",
    "nome": "Banco Bnp Paribas Brasil S.A.",
    "label": "752 - Banco Bnp Paribas Brasil S.A."
  },
  {
    "codigo": "753",
    "nome": "Novo Banco Continental S.A. - Banco Múltiplo",
    "label": "753 - Novo Banco Continental S.A. - Banco Múltiplo"
  },
  {
    "codigo": "754",
    "nome": "Banco Sistema S.A.",
    "label": "754 - Banco Sistema S.A."
  },
  {
    "codigo": "755",
    "nome": "Bank Of America Merrill Lynch Banco Múltiplo S.A.",
    "label": "755 - Bank Of America Merrill Lynch Banco Múltiplo S.A."
  },
  {
    "codigo": "756",
    "nome": "Bancoob (Sicoob)",
    "label": "756 - Bancoob (Sicoob)"
  },
  {
    "codigo": "757",
    "nome": "Banco Keb Hana do Brasil S.A.",
    "label": "757 - Banco Keb Hana do Brasil S.A."
  },
  {
    "codigo": "759",
    "nome": "Bansur Jm Sociedade de Crédito Direto S.A.",
    "label": "759 - Bansur Jm Sociedade de Crédito Direto S.A."
  },
  {
    "codigo": "760",
    "nome": "Emcash Serviços Financeiros Sociedade de Empréstimo Entre Pessoas S.A.",
    "label": "760 - Emcash Serviços Financeiros Sociedade de Empréstimo Entre Pessoas S.A."
  },
  {
    "codigo": "763",
    "nome": "Vue Instituição de Pagamento S.A.",
    "label": "763 - Vue Instituição de Pagamento S.A."
  },
  {
    "codigo": "765",
    "nome": "Pagsmile Instituição de Pagamento LTDA",
    "label": "765 - Pagsmile Instituição de Pagamento LTDA"
  },
  {
    "codigo": "766",
    "nome": "Lb Pay Instituição de Pagamento LTDA",
    "label": "766 - Lb Pay Instituição de Pagamento LTDA"
  },
  {
    "codigo": "769",
    "nome": "99pay Instituicao de Pagamento S.A.",
    "label": "769 - 99pay Instituicao de Pagamento S.A."
  },
  {
    "codigo": "770",
    "nome": "V3 Instituicao de Pagamento S.A.",
    "label": "770 - V3 Instituicao de Pagamento S.A."
  },
  {
    "codigo": "771",
    "nome": "Wx Instituicao de Pagamento LTDA",
    "label": "771 - Wx Instituicao de Pagamento LTDA"
  },
  {
    "codigo": "772",
    "nome": "Cooperativa de Crédito Mútuo dos Empregados do Centro Universitário Newton Paiva LTDA - Credipaiva",
    "label": "772 - Cooperativa de Crédito Mútuo dos Empregados do Centro Universitário Newton Paiva LTDA - Credipaiva"
  },
  {
    "codigo": "773",
    "nome": "Kiwify Instituicao de Pagamento LTDA",
    "label": "773 - Kiwify Instituicao de Pagamento LTDA"
  },
  {
    "codigo": "774",
    "nome": "Mova Sociedade de Empréstimo Entre Pessoas S.A.",
    "label": "774 - Mova Sociedade de Empréstimo Entre Pessoas S.A."
  },
  {
    "codigo": "775",
    "nome": "Contaazul Instituicao de Pagamento LTDA",
    "label": "775 - Contaazul Instituicao de Pagamento LTDA"
  },
  {
    "codigo": "778",
    "nome": "Pb Sociedade de Credito Direto S.A.",
    "label": "778 - Pb Sociedade de Credito Direto S.A."
  },
  {
    "codigo": "780",
    "nome": "Safetypay Brasil Instituicao de Pagamento LTDA",
    "label": "780 - Safetypay Brasil Instituicao de Pagamento LTDA"
  },
  {
    "codigo": "783",
    "nome": "Swap Instituição de Pagamento S.A.",
    "label": "783 - Swap Instituição de Pagamento S.A."
  },
  {
    "codigo": "785",
    "nome": "La Finteca Instituicao de Pagamento LTDA",
    "label": "785 - La Finteca Instituicao de Pagamento LTDA"
  },
  {
    "codigo": "786",
    "nome": "Awx Brasil Instituicao de Pagamento LTDA",
    "label": "786 - Awx Brasil Instituicao de Pagamento LTDA"
  },
  {
    "codigo": "787",
    "nome": "Attrus Instituição de Pagamento S.A.",
    "label": "787 - Attrus Instituição de Pagamento S.A."
  },
  {
    "codigo": "788",
    "nome": "Prototype Instituicao de Pagamento S.A.",
    "label": "788 - Prototype Instituicao de Pagamento S.A."
  },
  {
    "codigo": "789",
    "nome": "Apusdigital Instituicao de Pagamento LTDA",
    "label": "789 - Apusdigital Instituicao de Pagamento LTDA"
  },
  {
    "codigo": "790",
    "nome": "Max Instituição de Pagamento LTDA",
    "label": "790 - Max Instituição de Pagamento LTDA"
  },
  {
    "codigo": "792",
    "nome": "Nixfin Sociedade de Crédito Direto S.A.",
    "label": "792 - Nixfin Sociedade de Crédito Direto S.A."
  },
  {
    "codigo": "795",
    "nome": "Banco Traton Brasil S.A.",
    "label": "795 - Banco Traton Brasil S.A."
  },
  {
    "codigo": "804",
    "nome": "Mêntore Instituição de Pagamento S.A.",
    "label": "804 - Mêntore Instituição de Pagamento S.A."
  }
];

/**
 * Função utilitária para extrair o código COMPE de 3 dígitos de um texto ou objeto
 */
export function extrairCodigoCompe(texto?: string): string {
  if (!texto) return '';
  const match = texto.match(/(?:^|\D)(\d{3})(?:\D|$)/);
  if (match) return match[1];

  const lower = texto.toLowerCase();
  const found = BACEN_PF_BANKS.find(
    (b) => b.nome.toLowerCase().includes(lower) || lower.includes(b.nome.toLowerCase())
  );
  return found ? found.codigo : '';
}

/**
 * Retorna apenas o nome por extenso do banco (sem o prefixo de código COMPE)
 */
export function extrairNomePuroBanco(bancoNomeOuCodigo?: string): string {
  if (!bancoNomeOuCodigo || !bancoNomeOuCodigo.trim()) return '';
  const trimmed = bancoNomeOuCodigo.trim();
  if (/^\d{3}\s*-\s*/.test(trimmed)) {
    return trimmed.replace(/^\d{3}\s*-\s*/, '').trim();
  }
  const formatado = formatarBancoCompe(trimmed);
  return formatado.replace(/^\d{3}\s*-\s*/, '').trim();
}

/**
 * Função utilitária para buscar ou formatar o banco com código COMPE padrão: "104 - Caixa Econômica Federal"
 */
export function formatarBancoCompe(bancoNomeOuCodigo?: string): string {
  if (!bancoNomeOuCodigo) return '104 - Caixa Econômica Federal';
  const trimmed = bancoNomeOuCodigo.trim();

  if (/^\d{3}\s*-\s*.+/.test(trimmed)) {
    return trimmed;
  }

  const porCodigo = BACEN_PF_BANKS.find((b) => b.codigo === trimmed.padStart(3, '0'));
  if (porCodigo) return porCodigo.label;

  const lower = trimmed.toLowerCase();
  if (lower.includes('caixa')) return '104 - Caixa Econômica Federal';
  if (lower.includes('brasil')) return '001 - Banco do Brasil S.A.';
  if (lower.includes('bradesco')) return '237 - Banco Bradesco S.A.';
  if (lower.includes('itaú') || lower.includes('itau')) return '341 - Itaú Unibanco S.A.';
  if (lower.includes('santander')) return '033 - Banco Santander (Brasil) S.A.';
  if (lower.includes('nu') || lower.includes('nubank')) return '260 - Nu Pagamentos S.A. (Nubank)';
  if (lower.includes('inter')) return '077 - Banco Inter S.A.';
  if (lower.includes('c6')) return '336 - Banco C6 S.A.';
  if (lower.includes('picpay')) return '380 - PicPay Instituição de Pagamento S.A.';
  if (lower.includes('pagseguro') || lower.includes('pagbank')) return '290 - PagBank (PagSeguro Internet S.A.)';
  if (lower.includes('mercado pago')) return '323 - Mercado Pago Instituição de Pagamento LTDA';
  if (lower.includes('sicoob') || lower.includes('bancoob')) return '756 - Bancoob (Sicoob)';
  if (lower.includes('sicredi')) return '748 - Banco Cooperativo Sicredi S.A.';

  const porNome = BACEN_PF_BANKS.find(
    (b) => b.nome.toLowerCase().includes(lower) || lower.includes(b.nome.toLowerCase())
  );
  if (porNome) return porNome.label;

  return trimmed;
}
