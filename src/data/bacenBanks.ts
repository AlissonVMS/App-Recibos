/**
 * Lista atualizada de bancos e instituições de pagamento (IP) autorizados pelo BACEN (Banco Central do Brasil)
 * Fonte oficial: https://www.bcb.gov.br/content/estabilidadefinanceira/str1/ParticipantesSTR.csv
 * Filtrado exclusivamente para bancos de varejo e instituições voltadas a Pessoa Física (PF).
 */

export interface BacenBank {
  codigo: string;
  nome: string;
  label: string;
}

export const BACEN_PF_BANKS: BacenBank[] = [
  {
    "codigo": "104",
    "nome": "Caixa Econômica Federal",
    "label": "104 - Caixa Econômica Federal"
  },
  {
    "codigo": "001",
    "nome": "Banco do Brasil S.A.",
    "label": "001 - Banco do Brasil S.A."
  },
  {
    "codigo": "237",
    "nome": "Banco Bradesco S.A.",
    "label": "237 - Banco Bradesco S.A."
  },
  {
    "codigo": "341",
    "nome": "Itaú Unibanco S.A.",
    "label": "341 - Itaú Unibanco S.A."
  },
  {
    "codigo": "033",
    "nome": "Banco Santander (Brasil) S.A.",
    "label": "033 - Banco Santander (Brasil) S.A."
  },
  {
    "codigo": "260",
    "nome": "Nu Pagamentos S.A. (Nubank)",
    "label": "260 - Nu Pagamentos S.A. (Nubank)"
  },
  {
    "codigo": "077",
    "nome": "Banco Inter S.A.",
    "label": "077 - Banco Inter S.A."
  },
  {
    "codigo": "336",
    "nome": "Banco C6 S.A.",
    "label": "336 - Banco C6 S.A."
  },
  {
    "codigo": "380",
    "nome": "PicPay Instituição de Pagamento S.A.",
    "label": "380 - PicPay Instituição de Pagamento S.A."
  },
  {
    "codigo": "290",
    "nome": "PagBank / PagSeguro Internet IP S.A.",
    "label": "290 - PagBank / PagSeguro Internet IP S.A."
  },
  {
    "codigo": "323",
    "nome": "Mercado Pago IP Ltda.",
    "label": "323 - Mercado Pago IP Ltda."
  },
  {
    "codigo": "756",
    "nome": "Banco Cooperativo Sicoob S.A.",
    "label": "756 - Banco Cooperativo Sicoob S.A."
  },
  {
    "codigo": "748",
    "nome": "Banco Cooperativo Sicredi S.A.",
    "label": "748 - Banco Cooperativo Sicredi S.A."
  },
  {
    "codigo": "070",
    "nome": "BRB - Banco de Brasília S.A.",
    "label": "070 - BRB - Banco de Brasília S.A."
  },
  {
    "codigo": "041",
    "nome": "Banrisul - Banco do Estado do Rio Grande do Sul S.A.",
    "label": "041 - Banrisul - Banco do Estado do Rio Grande do Sul S.A."
  },
  {
    "codigo": "655",
    "nome": "Banco Votorantim S.A. (Neon / BV)",
    "label": "655 - Banco Votorantim S.A. (Neon / BV)"
  },
  {
    "codigo": "422",
    "nome": "Banco Safra S.A.",
    "label": "422 - Banco Safra S.A."
  },
  {
    "codigo": "623",
    "nome": "Banco PAN S.A.",
    "label": "623 - Banco PAN S.A."
  },
  {
    "codigo": "121",
    "nome": "Banco Agibank S.A.",
    "label": "121 - Banco Agibank S.A."
  },
  {
    "codigo": "318",
    "nome": "Banco BMG S.A.",
    "label": "318 - Banco BMG S.A."
  },
  {
    "codigo": "212",
    "nome": "Banco Original S.A.",
    "label": "212 - Banco Original S.A."
  },
  {
    "codigo": "208",
    "nome": "Banco BTG Pactual S.A.",
    "label": "208 - Banco BTG Pactual S.A."
  },
  {
    "codigo": "003",
    "nome": "BANCO DA AMAZONIA S.A.",
    "label": "003 - BANCO DA AMAZONIA S.A."
  },
  {
    "codigo": "004",
    "nome": "Banco do Nordeste do Brasil S.A.",
    "label": "004 - Banco do Nordeste do Brasil S.A."
  },
  {
    "codigo": "010",
    "nome": "CREDICOAMO CREDITO RURAL COOPERATIVA",
    "label": "010 - CREDICOAMO CREDITO RURAL COOPERATIVA"
  },
  {
    "codigo": "012",
    "nome": "Banco Inbursa S.A.",
    "label": "012 - Banco Inbursa S.A."
  },
  {
    "codigo": "014",
    "nome": "STATE STREET BRASIL S.A. - BANCO COMERCIAL",
    "label": "014 - STATE STREET BRASIL S.A. - BANCO COMERCIAL"
  },
  {
    "codigo": "016",
    "nome": "COOPERATIVA DE CRÉDITO MÚTUO DOS DESPACHANTES DE TRÂNSITO DE SANTA CATARINA E RIO GRANDE DO SUL - SICOOB CREDITRAN",
    "label": "016 - COOPERATIVA DE CRÉDITO MÚTUO DOS DESPACHANTES DE TRÂNSITO DE SANTA CATARINA E RIO GRANDE DO SUL - SICOOB CREDITRAN"
  },
  {
    "codigo": "017",
    "nome": "BNY Mellon Banco S.A.",
    "label": "017 - BNY Mellon Banco S.A."
  },
  {
    "codigo": "018",
    "nome": "Banco Tricury S.A.",
    "label": "018 - Banco Tricury S.A."
  },
  {
    "codigo": "021",
    "nome": "BANESTES S.A. BANCO DO ESTADO DO ESPIRITO SANTO",
    "label": "021 - BANESTES S.A. BANCO DO ESTADO DO ESPIRITO SANTO"
  },
  {
    "codigo": "023",
    "nome": "CONTA SIMPLES SOCIEDADE DE CRÉDITO DIRETO S.A.",
    "label": "023 - CONTA SIMPLES SOCIEDADE DE CRÉDITO DIRETO S.A."
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
    "codigo": "036",
    "nome": "Banco Bradesco BBI S.A.",
    "label": "036 - Banco Bradesco BBI S.A."
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
    "codigo": "047",
    "nome": "Banco do Estado de Sergipe S.A.",
    "label": "047 - Banco do Estado de Sergipe S.A."
  },
  {
    "codigo": "063",
    "nome": "Banco Bradescard S.A.",
    "label": "063 - Banco Bradescard S.A."
  },
  {
    "codigo": "065",
    "nome": "Banco AndBank (Brasil) S.A.",
    "label": "065 - Banco AndBank (Brasil) S.A."
  },
  {
    "codigo": "069",
    "nome": "Banco Crefisa S.A.",
    "label": "069 - Banco Crefisa S.A."
  },
  {
    "codigo": "074",
    "nome": "Banco J. Safra S.A.",
    "label": "074 - Banco J. Safra S.A."
  },
  {
    "codigo": "075",
    "nome": "BANCO ABN AMRO CLEARING S.A.",
    "label": "075 - BANCO ABN AMRO CLEARING S.A."
  },
  {
    "codigo": "076",
    "nome": "Banco KDB do Brasil S.A.",
    "label": "076 - Banco KDB do Brasil S.A."
  },
  {
    "codigo": "079",
    "nome": "PICPAY BANK - BANCO MÚLTIPLO S.A",
    "label": "079 - PICPAY BANK - BANCO MÚLTIPLO S.A"
  },
  {
    "codigo": "081",
    "nome": "BancoSeguro S.A.",
    "label": "081 - BancoSeguro S.A."
  },
  {
    "codigo": "082",
    "nome": "BANCO TOPÁZIO S.A.",
    "label": "082 - BANCO TOPÁZIO S.A."
  },
  {
    "codigo": "083",
    "nome": "Banco da China Brasil S.A.",
    "label": "083 - Banco da China Brasil S.A."
  },
  {
    "codigo": "084",
    "nome": "SISPRIME DO BRASIL - COOPERATIVA DE CRÉDITO",
    "label": "084 - SISPRIME DO BRASIL - COOPERATIVA DE CRÉDITO"
  },
  {
    "codigo": "085",
    "nome": "Cooperativa Central Ailos",
    "label": "085 - Cooperativa Central Ailos"
  },
  {
    "codigo": "088",
    "nome": "BANCO RANDON S.A.",
    "label": "088 - BANCO RANDON S.A."
  },
  {
    "codigo": "089",
    "nome": "CREDISAN COOPERATIVA DE CRÉDITO",
    "label": "089 - CREDISAN COOPERATIVA DE CRÉDITO"
  },
  {
    "codigo": "093",
    "nome": "PÓLOCRED   SOCIEDADE DE CRÉDITO AO MICROEMPREENDEDOR E À EMPRESA DE PEQUENO PORTE LTDA.",
    "label": "093 - PÓLOCRED   SOCIEDADE DE CRÉDITO AO MICROEMPREENDEDOR E À EMPRESA DE PEQUENO PORTE LTDA."
  },
  {
    "codigo": "094",
    "nome": "Banco Finaxis S.A.",
    "label": "094 - Banco Finaxis S.A."
  },
  {
    "codigo": "095",
    "nome": "BANCO TRAVELEX S.A.",
    "label": "095 - BANCO TRAVELEX S.A."
  },
  {
    "codigo": "097",
    "nome": "CREDISIS - CENTRAL DE COOPERATIVAS DE CRÉDITO",
    "label": "097 - CREDISIS - CENTRAL DE COOPERATIVAS DE CRÉDITO"
  },
  {
    "codigo": "099",
    "nome": "UNIPRIME CENTRAL NACIONAL - CENTRAL NACIONAL DE COOPERATIVA DE CREDITO",
    "label": "099 - UNIPRIME CENTRAL NACIONAL - CENTRAL NACIONAL DE COOPERATIVA DE CREDITO"
  },
  {
    "codigo": "107",
    "nome": "Banco Bocom BBM S.A.",
    "label": "107 - Banco Bocom BBM S.A."
  },
  {
    "codigo": "119",
    "nome": "Banco Western Union do Brasil S.A.",
    "label": "119 - Banco Western Union do Brasil S.A."
  },
  {
    "codigo": "120",
    "nome": "BANCO RODOBENS S.A.",
    "label": "120 - BANCO RODOBENS S.A."
  },
  {
    "codigo": "122",
    "nome": "Banco Bradesco BERJ S.A.",
    "label": "122 - Banco Bradesco BERJ S.A."
  },
  {
    "codigo": "124",
    "nome": "Banco Woori Bank do Brasil S.A.",
    "label": "124 - Banco Woori Bank do Brasil S.A."
  },
  {
    "codigo": "125",
    "nome": "BANCO GENIAL S.A.",
    "label": "125 - BANCO GENIAL S.A."
  },
  {
    "codigo": "132",
    "nome": "ICBC do Brasil Banco Múltiplo S.A.",
    "label": "132 - ICBC do Brasil Banco Múltiplo S.A."
  },
  {
    "codigo": "133",
    "nome": "CONFEDERAÇÃO NACIONAL DAS COOPERATIVAS CENTRAIS DE CRÉDITO E ECONOMIA FAMILIAR E SOLIDÁRIA - CRESOL CONFEDERAÇÃO",
    "label": "133 - CONFEDERAÇÃO NACIONAL DAS COOPERATIVAS CENTRAIS DE CRÉDITO E ECONOMIA FAMILIAR E SOLIDÁRIA - CRESOL CONFEDERAÇÃO"
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
    "codigo": "159",
    "nome": "Casa do Crédito S.A. Sociedade de Crédito ao Microempreendedor",
    "label": "159 - Casa do Crédito S.A. Sociedade de Crédito ao Microempreendedor"
  },
  {
    "codigo": "183",
    "nome": "SOCRED S.A. - SOCIEDADE DE CRÉDITO AO MICROEMPREENDEDOR E À EMPRESA DE PEQUENO PORTE",
    "label": "183 - SOCRED S.A. - SOCIEDADE DE CRÉDITO AO MICROEMPREENDEDOR E À EMPRESA DE PEQUENO PORTE"
  },
  {
    "codigo": "190",
    "nome": "SERVICOOP - COOPERATIVA DE CRÉDITO DOS SERVIDORES PÚBLICOS ESTADUAIS E MUNICIPAIS DO RIO GRANDE DO SUL",
    "label": "190 - SERVICOOP - COOPERATIVA DE CRÉDITO DOS SERVIDORES PÚBLICOS ESTADUAIS E MUNICIPAIS DO RIO GRANDE DO SUL"
  },
  {
    "codigo": "197",
    "nome": "Stone Instituição de Pagamento S.A.",
    "label": "197 - Stone Instituição de Pagamento S.A."
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
    "nome": "Banco BS2 S.A.",
    "label": "218 - Banco BS2 S.A."
  },
  {
    "codigo": "222",
    "nome": "BANCO CRÉDIT AGRICOLE BRASIL S.A.",
    "label": "222 - BANCO CRÉDIT AGRICOLE BRASIL S.A."
  },
  {
    "codigo": "224",
    "nome": "Banco Fibra S.A.",
    "label": "224 - Banco Fibra S.A."
  },
  {
    "codigo": "233",
    "nome": "BANCO BMG SOLUÇÕES FINANCEIRAS S.A.",
    "label": "233 - BANCO BMG SOLUÇÕES FINANCEIRAS S.A."
  },
  {
    "codigo": "241",
    "nome": "BANCO CLASSICO S.A.",
    "label": "241 - BANCO CLASSICO S.A."
  },
  {
    "codigo": "246",
    "nome": "Banco ABC Brasil S.A.",
    "label": "246 - Banco ABC Brasil S.A."
  },
  {
    "codigo": "249",
    "nome": "Banco Investcred Unibanco S.A.",
    "label": "249 - Banco Investcred Unibanco S.A."
  },
  {
    "codigo": "250",
    "nome": "BANCO BMG CONSIGNADO S.A.",
    "label": "250 - BANCO BMG CONSIGNADO S.A."
  },
  {
    "codigo": "254",
    "nome": "PARANÁ BANCO S.A.",
    "label": "254 - PARANÁ BANCO S.A."
  },
  {
    "codigo": "265",
    "nome": "Banco Fator S.A.",
    "label": "265 - Banco Fator S.A."
  },
  {
    "codigo": "266",
    "nome": "BANCO CEDULA S.A.",
    "label": "266 - BANCO CEDULA S.A."
  },
  {
    "codigo": "268",
    "nome": "BARI COMPANHIA HIPOTECÁRIA",
    "label": "268 - BARI COMPANHIA HIPOTECÁRIA"
  },
  {
    "codigo": "269",
    "nome": "BANCO HSBC S.A.",
    "label": "269 - BANCO HSBC S.A."
  },
  {
    "codigo": "273",
    "nome": "COOPERATIVA DE CREDITO SULCREDI AMPLEA",
    "label": "273 - COOPERATIVA DE CREDITO SULCREDI AMPLEA"
  },
  {
    "codigo": "274",
    "nome": "BMP SOCIEDADE DE CRÉDITO AO MICROEMPREENDEDOR E A EMPRESA DE PEQUENO PORTE LTDA.",
    "label": "274 - BMP SOCIEDADE DE CRÉDITO AO MICROEMPREENDEDOR E A EMPRESA DE PEQUENO PORTE LTDA."
  },
  {
    "codigo": "276",
    "nome": "BANCO SENFF S.A.",
    "label": "276 - BANCO SENFF S.A."
  },
  {
    "codigo": "281",
    "nome": "Cooperativa de Crédito Rural Coopavel",
    "label": "281 - Cooperativa de Crédito Rural Coopavel"
  },
  {
    "codigo": "299",
    "nome": "BANCO AFINZ S.A. - BANCO MÚLTIPLO",
    "label": "299 - BANCO AFINZ S.A. - BANCO MÚLTIPLO"
  },
  {
    "codigo": "300",
    "nome": "Banco de la Nacion Argentina",
    "label": "300 - Banco de la Nacion Argentina"
  },
  {
    "codigo": "301",
    "nome": "DOCK INSTITUIÇÃO DE PAGAMENTO S.A.",
    "label": "301 - DOCK INSTITUIÇÃO DE PAGAMENTO S.A."
  },
  {
    "codigo": "312",
    "nome": "HSCM - SOCIEDADE DE CRÉDITO AO MICROEMPREENDEDOR E À EMPRESA DE PEQUENO PORTE LTDA.",
    "label": "312 - HSCM - SOCIEDADE DE CRÉDITO AO MICROEMPREENDEDOR E À EMPRESA DE PEQUENO PORTE LTDA."
  },
  {
    "codigo": "320",
    "nome": "BANK OF CHINA (BRASIL) BANCO MÚLTIPLO S/A",
    "label": "320 - BANK OF CHINA (BRASIL) BANCO MÚLTIPLO S/A"
  },
  {
    "codigo": "321",
    "nome": "CREFAZ SOCIEDADE DE CRÉDITO AO MICROEMPREENDEDOR E A EMPRESA DE PEQUENO PORTE S.A.",
    "label": "321 - CREFAZ SOCIEDADE DE CRÉDITO AO MICROEMPREENDEDOR E A EMPRESA DE PEQUENO PORTE S.A."
  },
  {
    "codigo": "322",
    "nome": "Cooperativa de Crédito Rural de Abelardo Luz - Sulcredi/Crediluz",
    "label": "322 - Cooperativa de Crédito Rural de Abelardo Luz - Sulcredi/Crediluz"
  },
  {
    "codigo": "324",
    "nome": "CARTOS SOCIEDADE DE CRÉDITO DIRETO S.A.",
    "label": "324 - CARTOS SOCIEDADE DE CRÉDITO DIRETO S.A."
  },
  {
    "codigo": "329",
    "nome": "QI Sociedade de Crédito Direto S.A.",
    "label": "329 - QI Sociedade de Crédito Direto S.A."
  },
  {
    "codigo": "332",
    "nome": "ACESSO SOLUÇÕES DE PAGAMENTO S.A. - INSTITUIÇÃO DE PAGAMENTO",
    "label": "332 - ACESSO SOLUÇÕES DE PAGAMENTO S.A. - INSTITUIÇÃO DE PAGAMENTO"
  },
  {
    "codigo": "334",
    "nome": "BANCO BESA S.A.",
    "label": "334 - BANCO BESA S.A."
  },
  {
    "codigo": "335",
    "nome": "Banco Digio S.A.",
    "label": "335 - Banco Digio S.A."
  },
  {
    "codigo": "342",
    "nome": "Creditas Sociedade de Crédito Direto S.A.",
    "label": "342 - Creditas Sociedade de Crédito Direto S.A."
  },
  {
    "codigo": "348",
    "nome": "Banco XP S.A.",
    "label": "348 - Banco XP S.A."
  },
  {
    "codigo": "350",
    "nome": "COOPERATIVA DE CRÉDITO POPULAR DO BRASIL - CREHNOR",
    "label": "350 - COOPERATIVA DE CRÉDITO POPULAR DO BRASIL - CREHNOR"
  },
  {
    "codigo": "355",
    "nome": "ÓTIMO SOCIEDADE DE CRÉDITO DIRETO S.A.",
    "label": "355 - ÓTIMO SOCIEDADE DE CRÉDITO DIRETO S.A."
  },
  {
    "codigo": "362",
    "nome": "CIELO S.A. - INSTITUIÇÃO DE PAGAMENTO",
    "label": "362 - CIELO S.A. - INSTITUIÇÃO DE PAGAMENTO"
  },
  {
    "codigo": "364",
    "nome": "EFÍ S.A. - INSTITUIÇÃO DE PAGAMENTO",
    "label": "364 - EFÍ S.A. - INSTITUIÇÃO DE PAGAMENTO"
  },
  {
    "codigo": "368",
    "nome": "Banco CSF S.A.",
    "label": "368 - Banco CSF S.A."
  },
  {
    "codigo": "373",
    "nome": "UP.P SOCIEDADE DE EMPRÉSTIMO ENTRE PESSOAS S.A.",
    "label": "373 - UP.P SOCIEDADE DE EMPRÉSTIMO ENTRE PESSOAS S.A."
  },
  {
    "codigo": "376",
    "nome": "BANCO J.P. MORGAN S.A.",
    "label": "376 - BANCO J.P. MORGAN S.A."
  },
  {
    "codigo": "377",
    "nome": "BMS SOCIEDADE DE CRÉDITO DIRETO S.A.",
    "label": "377 - BMS SOCIEDADE DE CRÉDITO DIRETO S.A."
  },
  {
    "codigo": "378",
    "nome": "BANCO BRASILEIRO DE CRÉDITO SOCIEDADE ANÔNIMA",
    "label": "378 - BANCO BRASILEIRO DE CRÉDITO SOCIEDADE ANÔNIMA"
  },
  {
    "codigo": "381",
    "nome": "BANCO MERCEDES-BENZ DO BRASIL S.A.",
    "label": "381 - BANCO MERCEDES-BENZ DO BRASIL S.A."
  },
  {
    "codigo": "382",
    "nome": "FIDÚCIA SOCIEDADE DE CRÉDITO AO MICROEMPREENDEDOR E À EMPRESA DE PEQUENO PORTE LIMITADA.",
    "label": "382 - FIDÚCIA SOCIEDADE DE CRÉDITO AO MICROEMPREENDEDOR E À EMPRESA DE PEQUENO PORTE LIMITADA."
  },
  {
    "codigo": "383",
    "nome": "EBANX INSTITUICAO DE PAGAMENTOS LTDA.",
    "label": "383 - EBANX INSTITUICAO DE PAGAMENTOS LTDA."
  },
  {
    "codigo": "384",
    "nome": "GLOBAL FINANÇAS SOCIEDADE DE CRÉDITO AO MICROEMPREENDEDOR E À EMPRESA DE PEQUENO PORTE LTDA.",
    "label": "384 - GLOBAL FINANÇAS SOCIEDADE DE CRÉDITO AO MICROEMPREENDEDOR E À EMPRESA DE PEQUENO PORTE LTDA."
  },
  {
    "codigo": "385",
    "nome": "COOPERATIVA DE ECONOMIA E CREDITO MUTUO DOS TRABALHADORES PORTUARIOS DA GRANDE VITORIA - CREDESTIVA.",
    "label": "385 - COOPERATIVA DE ECONOMIA E CREDITO MUTUO DOS TRABALHADORES PORTUARIOS DA GRANDE VITORIA - CREDESTIVA."
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
    "nome": "BANCO GM S.A.",
    "label": "390 - BANCO GM S.A."
  },
  {
    "codigo": "391",
    "nome": "COOPERATIVA DE CREDITO RURAL DE IBIAM - SULCREDI/IBIAM",
    "label": "391 - COOPERATIVA DE CREDITO RURAL DE IBIAM - SULCREDI/IBIAM"
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
    "nome": "MAGALUPAY INSTITUIÇÃO DE PAGAMENTO S.A.",
    "label": "396 - MAGALUPAY INSTITUIÇÃO DE PAGAMENTO S.A."
  },
  {
    "codigo": "397",
    "nome": "LISTO SOCIEDADE DE CREDITO DIRETO S.A.",
    "label": "397 - LISTO SOCIEDADE DE CREDITO DIRETO S.A."
  },
  {
    "codigo": "399",
    "nome": "Kirton Bank S.A. - Banco Múltiplo",
    "label": "399 - Kirton Bank S.A. - Banco Múltiplo"
  },
  {
    "codigo": "400",
    "nome": "COOPERATIVA DE CRÉDITO, POUPANÇA E SERVIÇOS FINANCEIROS - EM LIQUIDAÇÃO EXTRAJUDICIAL",
    "label": "400 - COOPERATIVA DE CRÉDITO, POUPANÇA E SERVIÇOS FINANCEIROS - EM LIQUIDAÇÃO EXTRAJUDICIAL"
  },
  {
    "codigo": "401",
    "nome": "IUGU INSTITUIÇÃO DE PAGAMENTO S.A.",
    "label": "401 - IUGU INSTITUIÇÃO DE PAGAMENTO S.A."
  },
  {
    "codigo": "406",
    "nome": "ACCREDITO - SOCIEDADE DE CRÉDITO DIRETO S.A.",
    "label": "406 - ACCREDITO - SOCIEDADE DE CRÉDITO DIRETO S.A."
  },
  {
    "codigo": "408",
    "nome": "BONUSPAGO SOCIEDADE DE CRÉDITO DIRETO S.A.",
    "label": "408 - BONUSPAGO SOCIEDADE DE CRÉDITO DIRETO S.A."
  },
  {
    "codigo": "410",
    "nome": "PLANNER SOCIEDADE DE CRÉDITO DIRETO S.A.",
    "label": "410 - PLANNER SOCIEDADE DE CRÉDITO DIRETO S.A."
  },
  {
    "codigo": "412",
    "nome": "SOCIAL BANK BANCO MÚLTIPLO S/A",
    "label": "412 - SOCIAL BANK BANCO MÚLTIPLO S/A"
  },
  {
    "codigo": "413",
    "nome": "BANCO BV S.A.",
    "label": "413 - BANCO BV S.A."
  },
  {
    "codigo": "414",
    "nome": "LEND SOCIEDADE DE CRÉDITO DIRETO S.A.",
    "label": "414 - LEND SOCIEDADE DE CRÉDITO DIRETO S.A."
  },
  {
    "codigo": "415",
    "nome": "BANCO NACIONAL S.A.",
    "label": "415 - BANCO NACIONAL S.A."
  },
  {
    "codigo": "416",
    "nome": "LAMARA SOCIEDADE DE CRÉDITO DIRETO S.A.",
    "label": "416 - LAMARA SOCIEDADE DE CRÉDITO DIRETO S.A."
  },
  {
    "codigo": "418",
    "nome": "ZIPDIN SOLUÇÕES DIGITAIS SOCIEDADE DE CRÉDITO DIRETO S/A",
    "label": "418 - ZIPDIN SOLUÇÕES DIGITAIS SOCIEDADE DE CRÉDITO DIRETO S/A"
  },
  {
    "codigo": "419",
    "nome": "NUMBRS SOCIEDADE DE CRÉDITO DIRETO S.A.",
    "label": "419 - NUMBRS SOCIEDADE DE CRÉDITO DIRETO S.A."
  },
  {
    "codigo": "421",
    "nome": "LAR COOPERATIVA DE CRÉDITO - LAR CREDI",
    "label": "421 - LAR COOPERATIVA DE CRÉDITO - LAR CREDI"
  },
  {
    "codigo": "427",
    "nome": "COOPERATIVA DE CRÉDITO DOS SERVIDORES DA UNIVERSIDADE FEDERAL DO ESPIRITO SANTO",
    "label": "427 - COOPERATIVA DE CRÉDITO DOS SERVIDORES DA UNIVERSIDADE FEDERAL DO ESPIRITO SANTO"
  },
  {
    "codigo": "428",
    "nome": "CREDSYSTEM SOCIEDADE DE CRÉDITO DIRETO S.A.",
    "label": "428 - CREDSYSTEM SOCIEDADE DE CRÉDITO DIRETO S.A."
  },
  {
    "codigo": "430",
    "nome": "COOPERATIVA DE CREDITO RURAL SEARA - CREDISEARA",
    "label": "430 - COOPERATIVA DE CREDITO RURAL SEARA - CREDISEARA"
  },
  {
    "codigo": "435",
    "nome": "DELFINANCE SOCIEDADE DE CREDITO DIRETO S.A.",
    "label": "435 - DELFINANCE SOCIEDADE DE CREDITO DIRETO S.A."
  },
  {
    "codigo": "444",
    "nome": "TRINUS SOCIEDADE DE CRÉDITO DIRETO S.A.",
    "label": "444 - TRINUS SOCIEDADE DE CRÉDITO DIRETO S.A."
  },
  {
    "codigo": "449",
    "nome": "DM SOCIEDADE DE CRÉDITO DIRETO S.A.",
    "label": "449 - DM SOCIEDADE DE CRÉDITO DIRETO S.A."
  },
  {
    "codigo": "450",
    "nome": "FITS INSTITUIÇÃO DE PAGAMENTO S.A.",
    "label": "450 - FITS INSTITUIÇÃO DE PAGAMENTO S.A."
  },
  {
    "codigo": "451",
    "nome": "J17 - SOCIEDADE DE CRÉDITO DIRETO S/A",
    "label": "451 - J17 - SOCIEDADE DE CRÉDITO DIRETO S/A"
  },
  {
    "codigo": "452",
    "nome": "CREDIFIT SOCIEDADE DE CRÉDITO DIRETO S.A.",
    "label": "452 - CREDIFIT SOCIEDADE DE CRÉDITO DIRETO S.A."
  },
  {
    "codigo": "457",
    "nome": "UY3 SOCIEDADE DE CRÉDITO DIRETO S/A",
    "label": "457 - UY3 SOCIEDADE DE CRÉDITO DIRETO S/A"
  },
  {
    "codigo": "460",
    "nome": "UNAVANTI SOCIEDADE DE CRÉDITO DIRETO S/A",
    "label": "460 - UNAVANTI SOCIEDADE DE CRÉDITO DIRETO S/A"
  },
  {
    "codigo": "461",
    "nome": "ASAAS GESTÃO FINANCEIRA INSTITUIÇÃO DE PAGAMENTO S.A.",
    "label": "461 - ASAAS GESTÃO FINANCEIRA INSTITUIÇÃO DE PAGAMENTO S.A."
  },
  {
    "codigo": "462",
    "nome": "STARK SOCIEDADE DE CRÉDITO DIRETO S.A.",
    "label": "462 - STARK SOCIEDADE DE CRÉDITO DIRETO S.A."
  },
  {
    "codigo": "465",
    "nome": "CAPITAL CONSIG SOCIEDADE DE CRÉDITO DIRETO S.A.",
    "label": "465 - CAPITAL CONSIG SOCIEDADE DE CRÉDITO DIRETO S.A."
  },
  {
    "codigo": "470",
    "nome": "CDC SOCIEDADE DE CRÉDITO DIRETO S.A.",
    "label": "470 - CDC SOCIEDADE DE CRÉDITO DIRETO S.A."
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
    "nome": "IDEA MAKER INSTITUICAO DE PAGAMENTO LTDA",
    "label": "476 - IDEA MAKER INSTITUICAO DE PAGAMENTO LTDA"
  },
  {
    "codigo": "479",
    "nome": "Banco ItauBank S.A.",
    "label": "479 - Banco ItauBank S.A."
  },
  {
    "codigo": "481",
    "nome": "SUPERLÓGICA SOCIEDADE DE CRÉDITO DIRETO S.A.",
    "label": "481 - SUPERLÓGICA SOCIEDADE DE CRÉDITO DIRETO S.A."
  },
  {
    "codigo": "482",
    "nome": "ARTTA SOCIEDADE DE CRÉDITO DIRETO S.A",
    "label": "482 - ARTTA SOCIEDADE DE CRÉDITO DIRETO S.A"
  },
  {
    "codigo": "488",
    "nome": "JPMorgan Chase Bank, National Association",
    "label": "488 - JPMorgan Chase Bank, National Association"
  },
  {
    "codigo": "495",
    "nome": "Banco de La Provincia de Buenos Aires",
    "label": "495 - Banco de La Provincia de Buenos Aires"
  },
  {
    "codigo": "509",
    "nome": "CELCOIN INSTITUICAO DE PAGAMENTO S.A.",
    "label": "509 - CELCOIN INSTITUICAO DE PAGAMENTO S.A."
  },
  {
    "codigo": "510",
    "nome": "FFCRED SOCIEDADE DE CRÉDITO DIRETO S.A..",
    "label": "510 - FFCRED SOCIEDADE DE CRÉDITO DIRETO S.A.."
  },
  {
    "codigo": "511",
    "nome": "MAGNUM SOCIEDADE DE CRÉDITO DIRETO S.A.",
    "label": "511 - MAGNUM SOCIEDADE DE CRÉDITO DIRETO S.A."
  },
  {
    "codigo": "513",
    "nome": "ATF SOCIEDADE DE CRÉDITO DIRETO S.A.",
    "label": "513 - ATF SOCIEDADE DE CRÉDITO DIRETO S.A."
  },
  {
    "codigo": "517",
    "nome": "PAGUEVELOZ INSTITUIÇÃO DE PAGAMENTO LTDA.",
    "label": "517 - PAGUEVELOZ INSTITUIÇÃO DE PAGAMENTO LTDA."
  },
  {
    "codigo": "520",
    "nome": "SOMAPAY SOCIEDADE DE CRÉDITO DIRETO S.A.",
    "label": "520 - SOMAPAY SOCIEDADE DE CRÉDITO DIRETO S.A."
  },
  {
    "codigo": "521",
    "nome": "PEAK SOCIEDADE DE EMPRÉSTIMO ENTRE PESSOAS S.A.",
    "label": "521 - PEAK SOCIEDADE DE EMPRÉSTIMO ENTRE PESSOAS S.A."
  },
  {
    "codigo": "522",
    "nome": "RED SOCIEDADE DE CRÉDITO DIRETO S.A.",
    "label": "522 - RED SOCIEDADE DE CRÉDITO DIRETO S.A."
  },
  {
    "codigo": "523",
    "nome": "HR DIGITAL - SOCIEDADE DE CRÉDITO DIRETO S/A",
    "label": "523 - HR DIGITAL - SOCIEDADE DE CRÉDITO DIRETO S/A"
  },
  {
    "codigo": "525",
    "nome": "INTERCAM CORRETORA DE CÂMBIO LTDA.",
    "label": "525 - INTERCAM CORRETORA DE CÂMBIO LTDA."
  },
  {
    "codigo": "526",
    "nome": "MONETARIE SOCIEDADE DE CRÉDITO DIRETO S.A.",
    "label": "526 - MONETARIE SOCIEDADE DE CRÉDITO DIRETO S.A."
  },
  {
    "codigo": "527",
    "nome": "ATICCA - SOCIEDADE DE CRÉDITO DIRETO S.A.",
    "label": "527 - ATICCA - SOCIEDADE DE CRÉDITO DIRETO S.A."
  },
  {
    "codigo": "529",
    "nome": "PINBANK BRASIL INSTITUIÇÃO DE PAGAMENTO S.A.",
    "label": "529 - PINBANK BRASIL INSTITUIÇÃO DE PAGAMENTO S.A."
  },
  {
    "codigo": "530",
    "nome": "SER FINANCE SOCIEDADE DE CRÉDITO DIRETO S.A.",
    "label": "530 - SER FINANCE SOCIEDADE DE CRÉDITO DIRETO S.A."
  },
  {
    "codigo": "531",
    "nome": "BMP SOCIEDADE DE CRÉDITO DIRETO S.A",
    "label": "531 - BMP SOCIEDADE DE CRÉDITO DIRETO S.A"
  },
  {
    "codigo": "532",
    "nome": "FUTURO SOCIEDADE DE CRÉDITO DIRETO S.A.",
    "label": "532 - FUTURO SOCIEDADE DE CRÉDITO DIRETO S.A."
  },
  {
    "codigo": "533",
    "nome": "SRM BANK INSTITUIÇÃO DE PAGAMENTO S/A",
    "label": "533 - SRM BANK INSTITUIÇÃO DE PAGAMENTO S/A"
  },
  {
    "codigo": "534",
    "nome": "EWALLY INSTITUIÇÃO DE PAGAMENTO S.A.",
    "label": "534 - EWALLY INSTITUIÇÃO DE PAGAMENTO S.A."
  },
  {
    "codigo": "535",
    "nome": "OPEA SOCIEDADE DE CRÉDITO DIRETO S.A.",
    "label": "535 - OPEA SOCIEDADE DE CRÉDITO DIRETO S.A."
  },
  {
    "codigo": "536",
    "nome": "NEON PAGAMENTOS S.A. - INSTITUIÇÃO DE PAGAMENTO",
    "label": "536 - NEON PAGAMENTOS S.A. - INSTITUIÇÃO DE PAGAMENTO"
  },
  {
    "codigo": "537",
    "nome": "SELECT CREDIT SOCIEDADE DE CRÉDITO AO MICROEMPREENDEDOR E À EMPRESA DE PEQUENO PORTE LTDA.",
    "label": "537 - SELECT CREDIT SOCIEDADE DE CRÉDITO AO MICROEMPREENDEDOR E À EMPRESA DE PEQUENO PORTE LTDA."
  },
  {
    "codigo": "538",
    "nome": "SUDACRED SOCIEDADE DE CRÉDITO DIRETO S.A.",
    "label": "538 - SUDACRED SOCIEDADE DE CRÉDITO DIRETO S.A."
  },
  {
    "codigo": "540",
    "nome": "HBI SOCIEDADE DE CRÉDITO DIRETO S/A.",
    "label": "540 - HBI SOCIEDADE DE CRÉDITO DIRETO S/A."
  },
  {
    "codigo": "542",
    "nome": "CLOUDWALK INSTITUIÇÃO DE PAGAMENTO E SERVICOS LTDA",
    "label": "542 - CLOUDWALK INSTITUIÇÃO DE PAGAMENTO E SERVICOS LTDA"
  },
  {
    "codigo": "543",
    "nome": "COOPERATIVA DE ECONOMIA E CRÉDITO MÚTUO DOS ELETRICITÁRIOS E DOS TRABALHADORES DAS EMPRESAS DO SETOR DE ENERGIA - COOPCRECE",
    "label": "543 - COOPERATIVA DE ECONOMIA E CRÉDITO MÚTUO DOS ELETRICITÁRIOS E DOS TRABALHADORES DAS EMPRESAS DO SETOR DE ENERGIA - COOPCRECE"
  },
  {
    "codigo": "544",
    "nome": "MULTICRED SOCIEDADE DE CRÉDITO DIRETO S.A.",
    "label": "544 - MULTICRED SOCIEDADE DE CRÉDITO DIRETO S.A."
  },
  {
    "codigo": "546",
    "nome": "OKTO INSTITUIÇÃO DE PAGAMENTO S.A.",
    "label": "546 - OKTO INSTITUIÇÃO DE PAGAMENTO S.A."
  },
  {
    "codigo": "547",
    "nome": "BNK DIGITAL SOCIEDADE DE CRÉDITO DIRETO S.A.",
    "label": "547 - BNK DIGITAL SOCIEDADE DE CRÉDITO DIRETO S.A."
  },
  {
    "codigo": "550",
    "nome": "BEETELLER INSTITUIÇÃO DE PAGAMENTO LTDA.",
    "label": "550 - BEETELLER INSTITUIÇÃO DE PAGAMENTO LTDA."
  },
  {
    "codigo": "552",
    "nome": "UZZIPAY INSTITUIÇÃO DE PAGAMENTO S.A.",
    "label": "552 - UZZIPAY INSTITUIÇÃO DE PAGAMENTO S.A."
  },
  {
    "codigo": "553",
    "nome": "PERCAPITAL SOCIEDADE DE CRÉDITO DIRETO S.A.",
    "label": "553 - PERCAPITAL SOCIEDADE DE CRÉDITO DIRETO S.A."
  },
  {
    "codigo": "554",
    "nome": "BANCO STONEX S.A.",
    "label": "554 - BANCO STONEX S.A."
  },
  {
    "codigo": "555",
    "nome": "PAN FINANCEIRA S.A. - SOCIEDADE DE CRÉDITO, FINANCIAMENTO E INVESTIMENTOS",
    "label": "555 - PAN FINANCEIRA S.A. - SOCIEDADE DE CRÉDITO, FINANCIAMENTO E INVESTIMENTOS"
  },
  {
    "codigo": "557",
    "nome": "PAGPRIME INSTITUICAO DE PAGAMENTO LTDA",
    "label": "557 - PAGPRIME INSTITUICAO DE PAGAMENTO LTDA"
  },
  {
    "codigo": "560",
    "nome": "MAG INSTITUICAO DE PAGAMENTO LTDA",
    "label": "560 - MAG INSTITUICAO DE PAGAMENTO LTDA"
  },
  {
    "codigo": "561",
    "nome": "PAY4FUN INSTITUICAO DE PAGAMENTO S.A.",
    "label": "561 - PAY4FUN INSTITUICAO DE PAGAMENTO S.A."
  },
  {
    "codigo": "563",
    "nome": "PROTEGE CASH INSTITUIÇÃO DE PAGAMENTO S.A.",
    "label": "563 - PROTEGE CASH INSTITUIÇÃO DE PAGAMENTO S.A."
  },
  {
    "codigo": "566",
    "nome": "FLAGSHIP INSTITUICAO DE PAGAMENTO LTDA",
    "label": "566 - FLAGSHIP INSTITUICAO DE PAGAMENTO LTDA"
  },
  {
    "codigo": "569",
    "nome": "CONTA PRONTA INSTITUICAO DE PAGAMENTO LTDA",
    "label": "569 - CONTA PRONTA INSTITUICAO DE PAGAMENTO LTDA"
  },
  {
    "codigo": "572",
    "nome": "ALL IN CRED SOCIEDADE DE CREDITO DIRETO S.A.",
    "label": "572 - ALL IN CRED SOCIEDADE DE CREDITO DIRETO S.A."
  },
  {
    "codigo": "573",
    "nome": "OXY COMPANHIA HIPOTECÁRIA",
    "label": "573 - OXY COMPANHIA HIPOTECÁRIA"
  },
  {
    "codigo": "574",
    "nome": "A55 SOCIEDADE DE CRÉDITO DIRETO S.A.",
    "label": "574 - A55 SOCIEDADE DE CRÉDITO DIRETO S.A."
  },
  {
    "codigo": "575",
    "nome": "DGBK CREDIT S.A. - SOCIEDADE DE CRÉDITO DIRETO.",
    "label": "575 - DGBK CREDIT S.A. - SOCIEDADE DE CRÉDITO DIRETO."
  },
  {
    "codigo": "576",
    "nome": "MERCADO BITCOIN INSTITUICAO DE PAGAMENTO LTDA",
    "label": "576 - MERCADO BITCOIN INSTITUICAO DE PAGAMENTO LTDA"
  },
  {
    "codigo": "577",
    "nome": "DESENVOLVE SP - AGÊNCIA DE FOMENTO DO ESTADO DE SÃO PAULO S.A.",
    "label": "577 - DESENVOLVE SP - AGÊNCIA DE FOMENTO DO ESTADO DE SÃO PAULO S.A."
  },
  {
    "codigo": "579",
    "nome": "QUADRA SOCIEDADE DE CRÉDITO DIRETO S.A.",
    "label": "579 - QUADRA SOCIEDADE DE CRÉDITO DIRETO S.A."
  },
  {
    "codigo": "585",
    "nome": "SETHI SOCIEDADE DE CRÉDITO DIRETO S.A.",
    "label": "585 - SETHI SOCIEDADE DE CRÉDITO DIRETO S.A."
  },
  {
    "codigo": "586",
    "nome": "Z1 INSTITUIÇÃO DE PAGAMENTO LTDA.",
    "label": "586 - Z1 INSTITUIÇÃO DE PAGAMENTO LTDA."
  },
  {
    "codigo": "588",
    "nome": "AVANCARD PROVER INSTITUIÇÃO DE PAGAMENTO LTDA",
    "label": "588 - AVANCARD PROVER INSTITUIÇÃO DE PAGAMENTO LTDA"
  },
  {
    "codigo": "589",
    "nome": "G5 SOCIEDADE DE CRÉDITO DIRETO S.A.",
    "label": "589 - G5 SOCIEDADE DE CRÉDITO DIRETO S.A."
  },
  {
    "codigo": "590",
    "nome": "REPASSES FINANCEIROS E SOLUCOES TECNOLOGICAS INSTITUICAO DE PAGAMENTO S.A.",
    "label": "590 - REPASSES FINANCEIROS E SOLUCOES TECNOLOGICAS INSTITUICAO DE PAGAMENTO S.A."
  },
  {
    "codigo": "592",
    "nome": "INSTITUIÇÃO DE PAGAMENTOS MAPS LTDA.",
    "label": "592 - INSTITUIÇÃO DE PAGAMENTOS MAPS LTDA."
  },
  {
    "codigo": "593",
    "nome": "TRANSFEERA INSTITUIÇÃO DE PAGAMENTO S.A",
    "label": "593 - TRANSFEERA INSTITUIÇÃO DE PAGAMENTO S.A"
  },
  {
    "codigo": "595",
    "nome": "IFOOD PAGO INSTITUIÇÃO DE PAGAMENTO S.A.",
    "label": "595 - IFOOD PAGO INSTITUIÇÃO DE PAGAMENTO S.A."
  },
  {
    "codigo": "596",
    "nome": "CACTVS INSTITUICAO DE PAGAMENTO S.A",
    "label": "596 - CACTVS INSTITUICAO DE PAGAMENTO S.A"
  },
  {
    "codigo": "597",
    "nome": "ISSUER INSTITUICAO DE PAGAMENTO LTDA.",
    "label": "597 - ISSUER INSTITUICAO DE PAGAMENTO LTDA."
  },
  {
    "codigo": "598",
    "nome": "KONECT SOCIEDADE DE CRÉDITO DIRETO S/A",
    "label": "598 - KONECT SOCIEDADE DE CRÉDITO DIRETO S/A"
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
    "nome": "Banco VR S.A.",
    "label": "610 - Banco VR S.A."
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
    "nome": "SANTS SOCIEDADE DE CRÉDITO DIRETO S.A.",
    "label": "614 - SANTS SOCIEDADE DE CRÉDITO DIRETO S.A."
  },
  {
    "codigo": "615",
    "nome": "SMART SOLUTIONS GROUP INSTITUICAO DE PAGAMENTO LTDA",
    "label": "615 - SMART SOLUTIONS GROUP INSTITUICAO DE PAGAMENTO LTDA"
  },
  {
    "codigo": "619",
    "nome": "TRIO INSTITUICAO DE PAGAMENTO LTDA.",
    "label": "619 - TRIO INSTITUICAO DE PAGAMENTO LTDA."
  },
  {
    "codigo": "620",
    "nome": "REVOLUT SOCIEDADE DE CRÉDITO DIRETO S.A.",
    "label": "620 - REVOLUT SOCIEDADE DE CRÉDITO DIRETO S.A."
  },
  {
    "codigo": "626",
    "nome": "BANCO C6 CONSIGNADO S.A.",
    "label": "626 - BANCO C6 CONSIGNADO S.A."
  },
  {
    "codigo": "632",
    "nome": "Z-ON SOCIEDADE DE CRÉDITO DIRETO S.A.",
    "label": "632 - Z-ON SOCIEDADE DE CRÉDITO DIRETO S.A."
  },
  {
    "codigo": "633",
    "nome": "Banco Rendimento S.A.",
    "label": "633 - Banco Rendimento S.A."
  },
  {
    "codigo": "634",
    "nome": "BANCO TRIANGULO S.A.",
    "label": "634 - BANCO TRIANGULO S.A."
  },
  {
    "codigo": "636",
    "nome": "GIRO - SOCIEDADE DE CRÉDITO DIRETO S/A",
    "label": "636 - GIRO - SOCIEDADE DE CRÉDITO DIRETO S/A"
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
    "nome": "321 SOCIEDADE DE CRÉDITO DIRETO S.A.",
    "label": "644 - 321 SOCIEDADE DE CRÉDITO DIRETO S.A."
  },
  {
    "codigo": "651",
    "nome": "PAGARE INSTITUICAO DE PAGAMENTO S.A.",
    "label": "651 - PAGARE INSTITUICAO DE PAGAMENTO S.A."
  },
  {
    "codigo": "654",
    "nome": "Banco Digimais S.A.",
    "label": "654 - Banco Digimais S.A."
  },
  {
    "codigo": "659",
    "nome": "ONEKEY PAYMENTS INSTITUICAO DE PAGAMENTO SA",
    "label": "659 - ONEKEY PAYMENTS INSTITUICAO DE PAGAMENTO SA"
  },
  {
    "codigo": "660",
    "nome": "PAGME INSTITUIÇÃO DE PAGAMENTO LTDA.",
    "label": "660 - PAGME INSTITUIÇÃO DE PAGAMENTO LTDA."
  },
  {
    "codigo": "662",
    "nome": "WE PAY OUT INSTITUICAO DE PAGAMENTO LTDA.",
    "label": "662 - WE PAY OUT INSTITUICAO DE PAGAMENTO LTDA."
  },
  {
    "codigo": "665",
    "nome": "STARK BANK S.A. - INSTITUICAO DE PAGAMENTO",
    "label": "665 - STARK BANK S.A. - INSTITUICAO DE PAGAMENTO"
  },
  {
    "codigo": "668",
    "nome": "CELCOIN SOCIEDADE DE CRÉDITO DIRETO S.A.",
    "label": "668 - CELCOIN SOCIEDADE DE CRÉDITO DIRETO S.A."
  },
  {
    "codigo": "669",
    "nome": "TRANSFERO INSTITUICAO DE PAGAMENTO LTDA.",
    "label": "669 - TRANSFERO INSTITUICAO DE PAGAMENTO LTDA."
  },
  {
    "codigo": "670",
    "nome": "BSN PAGAMENTOS INSTITUIÇÃO DE PAGAMENTO LTDA",
    "label": "670 - BSN PAGAMENTOS INSTITUIÇÃO DE PAGAMENTO LTDA"
  },
  {
    "codigo": "671",
    "nome": "ZERO INSTITUIÇÃO DE PAGAMENTO S.A.",
    "label": "671 - ZERO INSTITUIÇÃO DE PAGAMENTO S.A."
  },
  {
    "codigo": "673",
    "nome": "COOPERATIVA DE CRÉDITO RURAL DO AGRESTE ALAGOANO - COOPERAGRE",
    "label": "673 - COOPERATIVA DE CRÉDITO RURAL DO AGRESTE ALAGOANO - COOPERAGRE"
  },
  {
    "codigo": "674",
    "nome": "HINOVA PAY INSTITUICAO DE PAGAMENTO S.A.",
    "label": "674 - HINOVA PAY INSTITUICAO DE PAGAMENTO S.A."
  },
  {
    "codigo": "675",
    "nome": "CASAS BAHIA PAY INSTITUIÇÃO DE PAGAMENTO LTDA.",
    "label": "675 - CASAS BAHIA PAY INSTITUIÇÃO DE PAGAMENTO LTDA."
  },
  {
    "codigo": "677",
    "nome": "GOWD INSTITUIÇÃO DE PAGAMENTO LTDA.",
    "label": "677 - GOWD INSTITUIÇÃO DE PAGAMENTO LTDA."
  },
  {
    "codigo": "678",
    "nome": "FIDEM SOCIEDADE DE CRÉDITO DIRETO S/A",
    "label": "678 - FIDEM SOCIEDADE DE CRÉDITO DIRETO S/A"
  },
  {
    "codigo": "679",
    "nome": "PAY INSTITUICAO DE PAGAMENTO S.A.",
    "label": "679 - PAY INSTITUICAO DE PAGAMENTO S.A."
  },
  {
    "codigo": "680",
    "nome": "DELTA GLOBAL SOCIEDADE DE CRÉDITO DIRETO S.A.",
    "label": "680 - DELTA GLOBAL SOCIEDADE DE CRÉDITO DIRETO S.A."
  },
  {
    "codigo": "681",
    "nome": "MT INSTITUICAO DE PAGAMENTO SA",
    "label": "681 - MT INSTITUICAO DE PAGAMENTO SA"
  },
  {
    "codigo": "682",
    "nome": "MONERY INSTITUICAO DE PAGAMENTO S.A.",
    "label": "682 - MONERY INSTITUICAO DE PAGAMENTO S.A."
  },
  {
    "codigo": "683",
    "nome": "BRASIL CASH INSTITUICAO DE PAGAMENTO S.A",
    "label": "683 - BRASIL CASH INSTITUICAO DE PAGAMENTO S.A"
  },
  {
    "codigo": "685",
    "nome": "TYCOON TECHNOLOGY INSTITUICAO DE PAGAMENTO S.A",
    "label": "685 - TYCOON TECHNOLOGY INSTITUICAO DE PAGAMENTO S.A"
  },
  {
    "codigo": "686",
    "nome": "BIZ INSTITUIÇÃO DE PAGAMENTO S.A.",
    "label": "686 - BIZ INSTITUIÇÃO DE PAGAMENTO S.A."
  },
  {
    "codigo": "687",
    "nome": "INCO SOCIEDADE DE EMPRÉSTIMO ENTRE PESSOAS S.A.",
    "label": "687 - INCO SOCIEDADE DE EMPRÉSTIMO ENTRE PESSOAS S.A."
  },
  {
    "codigo": "688",
    "nome": "KIKAI SOCIEDADE DE CRÉDITO DIRETO S.A.",
    "label": "688 - KIKAI SOCIEDADE DE CRÉDITO DIRETO S.A."
  },
  {
    "codigo": "690",
    "nome": "BK INSTITUIÇÃO DE PAGAMENTO S.A.",
    "label": "690 - BK INSTITUIÇÃO DE PAGAMENTO S.A."
  },
  {
    "codigo": "691",
    "nome": "WASU - WALLET SUPPORT INSTITUIÇÃO DE PAGAMENTO LTDA",
    "label": "691 - WASU - WALLET SUPPORT INSTITUIÇÃO DE PAGAMENTO LTDA"
  },
  {
    "codigo": "692",
    "nome": "ZYDI SOCIEDADE DE CRÉDITO DIRETO S.A.",
    "label": "692 - ZYDI SOCIEDADE DE CRÉDITO DIRETO S.A."
  },
  {
    "codigo": "693",
    "nome": "EFEX INSTITUIÇÃO DE PAGAMENTO S.A.",
    "label": "693 - EFEX INSTITUIÇÃO DE PAGAMENTO S.A."
  },
  {
    "codigo": "694",
    "nome": "WOOVI INSTITUICAO DE PAGAMENTO LTDA",
    "label": "694 - WOOVI INSTITUICAO DE PAGAMENTO LTDA"
  },
  {
    "codigo": "695",
    "nome": "BEES INSTITUICAO DE PAGAMENTO LTDA.",
    "label": "695 - BEES INSTITUICAO DE PAGAMENTO LTDA."
  },
  {
    "codigo": "696",
    "nome": "LOAN BRASIL SOCIEDADE DE CRÉDITO DIRETO S.A.",
    "label": "696 - LOAN BRASIL SOCIEDADE DE CRÉDITO DIRETO S.A."
  },
  {
    "codigo": "698",
    "nome": "BIT SOCIEDADE DE CRÉDITO DIRETO S.A.",
    "label": "698 - BIT SOCIEDADE DE CRÉDITO DIRETO S.A."
  },
  {
    "codigo": "699",
    "nome": "BFC SOCIEDADE DE CRÉDITO DIRETO S.A.",
    "label": "699 - BFC SOCIEDADE DE CRÉDITO DIRETO S.A."
  },
  {
    "codigo": "700",
    "nome": "MW INSTITUICAO DE PAGAMENTO LTDA",
    "label": "700 - MW INSTITUICAO DE PAGAMENTO LTDA"
  },
  {
    "codigo": "701",
    "nome": "INTEGRAÇÃO DE CRÉDITO E COBRANÇA SOCIEDADE DE CRÉDITO DIRETO S.A.",
    "label": "701 - INTEGRAÇÃO DE CRÉDITO E COBRANÇA SOCIEDADE DE CRÉDITO DIRETO S.A."
  },
  {
    "codigo": "703",
    "nome": "GETNET ADQUIRÊNCIA E SERVIÇOS PARA MEIOS DE PAGAMENTO S.A. INSTITUIÇÃO DE PAGAMENTO",
    "label": "703 - GETNET ADQUIRÊNCIA E SERVIÇOS PARA MEIOS DE PAGAMENTO S.A. INSTITUIÇÃO DE PAGAMENTO"
  },
  {
    "codigo": "704",
    "nome": "FESTOR INSTITUIÇÃO DE PAGAMENTO LTDA.",
    "label": "704 - FESTOR INSTITUIÇÃO DE PAGAMENTO LTDA."
  },
  {
    "codigo": "707",
    "nome": "Banco Daycoval S.A.",
    "label": "707 - Banco Daycoval S.A."
  },
  {
    "codigo": "712",
    "nome": "OURIBANK S.A. BANCO MÚLTIPLO",
    "label": "712 - OURIBANK S.A. BANCO MÚLTIPLO"
  },
  {
    "codigo": "741",
    "nome": "BANCO RIBEIRAO PRETO S.A.",
    "label": "741 - BANCO RIBEIRAO PRETO S.A."
  },
  {
    "codigo": "743",
    "nome": "Banco Semear S.A.",
    "label": "743 - Banco Semear S.A."
  },
  {
    "codigo": "747",
    "nome": "Banco Rabobank International Brasil S.A.",
    "label": "747 - Banco Rabobank International Brasil S.A."
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
    "codigo": "757",
    "nome": "BANCO KEB HANA DO BRASIL S.A.",
    "label": "757 - BANCO KEB HANA DO BRASIL S.A."
  },
  {
    "codigo": "759",
    "nome": "BANSUR JM SOCIEDADE DE CRÉDITO DIRETO S/A",
    "label": "759 - BANSUR JM SOCIEDADE DE CRÉDITO DIRETO S/A"
  },
  {
    "codigo": "760",
    "nome": "EMCASH SERVIÇOS FINANCEIROS SOCIEDADE DE EMPRÉSTIMO ENTRE PESSOAS S.A.",
    "label": "760 - EMCASH SERVIÇOS FINANCEIROS SOCIEDADE DE EMPRÉSTIMO ENTRE PESSOAS S.A."
  },
  {
    "codigo": "763",
    "nome": "VUE INSTITUIÇÃO DE PAGAMENTO S.A.",
    "label": "763 - VUE INSTITUIÇÃO DE PAGAMENTO S.A."
  },
  {
    "codigo": "765",
    "nome": "PAGSMILE INSTITUIÇÃO DE PAGAMENTO LTDA.",
    "label": "765 - PAGSMILE INSTITUIÇÃO DE PAGAMENTO LTDA."
  },
  {
    "codigo": "766",
    "nome": "LB PAY INSTITUIÇÃO DE PAGAMENTO LTDA",
    "label": "766 - LB PAY INSTITUIÇÃO DE PAGAMENTO LTDA"
  },
  {
    "codigo": "769",
    "nome": "99PAY INSTITUICAO DE PAGAMENTO S.A.",
    "label": "769 - 99PAY INSTITUICAO DE PAGAMENTO S.A."
  },
  {
    "codigo": "770",
    "nome": "V3 INSTITUICAO DE PAGAMENTO S.A.",
    "label": "770 - V3 INSTITUICAO DE PAGAMENTO S.A."
  },
  {
    "codigo": "771",
    "nome": "WX INSTITUICAO DE PAGAMENTO LTDA",
    "label": "771 - WX INSTITUICAO DE PAGAMENTO LTDA"
  },
  {
    "codigo": "772",
    "nome": "COOPERATIVA DE CRÉDITO MÚTUO DOS EMPREGADOS DO CENTRO UNIVERSITÁRIO NEWTON PAIVA LTDA. - CREDIPAIVA",
    "label": "772 - COOPERATIVA DE CRÉDITO MÚTUO DOS EMPREGADOS DO CENTRO UNIVERSITÁRIO NEWTON PAIVA LTDA. - CREDIPAIVA"
  },
  {
    "codigo": "773",
    "nome": "KIWIFY INSTITUICAO DE PAGAMENTO LTDA",
    "label": "773 - KIWIFY INSTITUICAO DE PAGAMENTO LTDA"
  },
  {
    "codigo": "774",
    "nome": "MOVA SOCIEDADE DE EMPRÉSTIMO ENTRE PESSOAS S.A.",
    "label": "774 - MOVA SOCIEDADE DE EMPRÉSTIMO ENTRE PESSOAS S.A."
  },
  {
    "codigo": "775",
    "nome": "CONTAAZUL INSTITUICAO DE PAGAMENTO LTDA.",
    "label": "775 - CONTAAZUL INSTITUICAO DE PAGAMENTO LTDA."
  },
  {
    "codigo": "778",
    "nome": "PB SOCIEDADE DE CREDITO DIRETO S.A.",
    "label": "778 - PB SOCIEDADE DE CREDITO DIRETO S.A."
  },
  {
    "codigo": "780",
    "nome": "SAFETYPAY BRASIL INSTITUICAO DE PAGAMENTO LTDA",
    "label": "780 - SAFETYPAY BRASIL INSTITUICAO DE PAGAMENTO LTDA"
  },
  {
    "codigo": "783",
    "nome": "SWAP INSTITUIÇÃO DE PAGAMENTO S.A.",
    "label": "783 - SWAP INSTITUIÇÃO DE PAGAMENTO S.A."
  },
  {
    "codigo": "785",
    "nome": "LA FINTECA INSTITUICAO DE PAGAMENTO LTDA",
    "label": "785 - LA FINTECA INSTITUICAO DE PAGAMENTO LTDA"
  },
  {
    "codigo": "786",
    "nome": "AWX BRASIL  INSTITUICAO DE PAGAMENTO LTDA",
    "label": "786 - AWX BRASIL  INSTITUICAO DE PAGAMENTO LTDA"
  },
  {
    "codigo": "787",
    "nome": "ATTRUS INSTITUIÇÃO DE PAGAMENTO S/A",
    "label": "787 - ATTRUS INSTITUIÇÃO DE PAGAMENTO S/A"
  },
  {
    "codigo": "788",
    "nome": "PROTOTYPE INSTITUICAO DE PAGAMENTO S.A.",
    "label": "788 - PROTOTYPE INSTITUICAO DE PAGAMENTO S.A."
  },
  {
    "codigo": "789",
    "nome": "APUSDIGITAL INSTITUICAO DE PAGAMENTO LTDA",
    "label": "789 - APUSDIGITAL INSTITUICAO DE PAGAMENTO LTDA"
  },
  {
    "codigo": "790",
    "nome": "MAX INSTITUIÇÃO DE PAGAMENTO LTDA",
    "label": "790 - MAX INSTITUIÇÃO DE PAGAMENTO LTDA"
  },
  {
    "codigo": "792",
    "nome": "NIXFIN SOCIEDADE DE CRÉDITO DIRETO S.A.",
    "label": "792 - NIXFIN SOCIEDADE DE CRÉDITO DIRETO S.A."
  },
  {
    "codigo": "795",
    "nome": "BANCO TRATON BRASIL S.A.",
    "label": "795 - BANCO TRATON BRASIL S.A."
  },
  {
    "codigo": "804",
    "nome": "MÊNTORE INSTITUIÇÃO DE PAGAMENTO S.A.",
    "label": "804 - MÊNTORE INSTITUIÇÃO DE PAGAMENTO S.A."
  }
];

/**
 * Função utilitária para extrair apenas o código COMPE de 3 dígitos de um texto
 */
export function extrairCodigoCompe(texto?: string): string {
  if (!texto) return '';
  const match = texto.match(/(\d{3})/);
  return match ? match[1] : '';
}

/**
 * Função utilitária para buscar ou formatar o banco com código COMPE
 */
export function formatarBancoCompe(bancoNomeOuCodigo?: string): string {
  if (!bancoNomeOuCodigo) return '104 - Caixa Econômica Federal';
  const trimmed = bancoNomeOuCodigo.trim();
  
  if (/^\d{3}\s*-\s*.+/.test(trimmed)) {
    return trimmed;
  }
  
  const porCodigo = BACEN_PF_BANKS.find(b => b.codigo === trimmed);
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

  const porNome = BACEN_PF_BANKS.find(b => 
    b.nome.toLowerCase().includes(lower) || lower.includes(b.nome.toLowerCase())
  );
  if (porNome) return porNome.label;

  return trimmed;
}
