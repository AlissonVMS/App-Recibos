using AppRecibos.Core.Domain.Entities;
using AppRecibos.Core.Domain.Enums;
using AppRecibos.Core.Infrastructure.Data.Repositories;

namespace AppRecibos.Core.Infrastructure.Data;

public class DbSeeder
{
    private readonly ContratoRepository _contratoRepo;
    private readonly BeneficiarioRepository _beneficiarioRepo;

    public DbSeeder(ContratoRepository contratoRepo, BeneficiarioRepository beneficiarioRepo)
    {
        _contratoRepo = contratoRepo;
        _beneficiarioRepo = beneficiarioRepo;
    }

    public async Task SeedInitialDataAsync()
    {
        var existingContrato = await _contratoRepo.GetAsync();
        if (existingContrato == null)
        {
            await _contratoRepo.SaveAsync(new ContratoConfig
            {
                PagadorNome = "ABIGAIL PAULINO DA SILVA",
                PagadorCpf = "450.519.504-00",
                PagadorBanco = "104 - Caixa Econômica Federal",
                TituloContrato = "Contrato de Promessa de Cessão de Direitos Hereditários",
                DataContrato = "2025-08-19"
            });
        }

        var existingBeneficiarios = await _beneficiarioRepo.GetAllAsync();
        if (!existingBeneficiarios.Any())
        {
            var ben1 = new Beneficiario
            {
                Id = "ben-1",
                Nome = "ELIANE MARIA DA SILVA",
                Cpf = "046.931.264-54",
                ContratoTotal = 30000m,
                TotalPago = 25500m,
                SaldoDevedor = 4500m,
                Status = "EM ABERTO",
                Banco = "Caixa Econômica Federal",
                Agencia = "3693",
                Conta = "786779864-2",
                Operacao = "1288",
                TipoConta = "POUPANÇA",
                ChavePix = "046.931.264-54",
                TipoChavePix = "CPF",
                CidadeUf = "Maceió - AL"
            };

            var ben2 = new Beneficiario
            {
                Id = "ben-2",
                Nome = "ELINALDO MARQUES DA SILVA",
                Cpf = "064.142.434-50",
                ContratoTotal = 30000m,
                TotalPago = 25500m,
                SaldoDevedor = 4500m,
                Status = "EM ABERTO",
                Banco = "Nu Pagamentos S.A.",
                Agencia = "1",
                Conta = "11297311-9",
                Operacao = "-",
                TipoConta = "CORRENTE",
                ChavePix = "064.142.434-50",
                TipoChavePix = "CPF",
                CidadeUf = "Barra de São Miguel - AL"
            };

            var ben3 = new Beneficiario
            {
                Id = "ben-3",
                Nome = "ELISANGELA MARIA VASCONCELOS DE ARAÚJO",
                Cpf = "341.267.018-93",
                ContratoTotal = 30000m,
                TotalPago = 25500m,
                SaldoDevedor = 4500m,
                Status = "EM ABERTO",
                Banco = "Caixa Econômica Federal",
                Agencia = "2047",
                Conta = "796940938-6",
                Operacao = "1288",
                TipoConta = "POUPANÇA",
                ChavePix = "(82)99929-1488",
                TipoChavePix = "TELEFONE",
                CidadeUf = "Barra de São Miguel - AL"
            };

            await _beneficiarioRepo.SaveAsync(ben1);
            await _beneficiarioRepo.SaveAsync(ben2);
            await _beneficiarioRepo.SaveAsync(ben3);
        }
    }
}
