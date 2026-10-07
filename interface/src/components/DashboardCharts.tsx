import React from 'react';
import { Beneficiary, ContractConfig, PaymentRecord } from '../types';
import { formatarNumeroMoeda } from '../utils/numberToWordsPtBr';
import { PieChart as PieChartIcon } from 'lucide-react';

interface DashboardChartsProps {
  beneficiaries: Beneficiary[];
  contract?: ContractConfig;
  payments?: PaymentRecord[];
}

// Cores oficiais
const COLOR_REALIZADO = '#10b981'; // Verde Esmeralda (Realizado)
const COLOR_COMPROMETIDO = '#f59e0b'; // Amarelo Âmbar (Comprometido)

export const DashboardCharts: React.FC<DashboardChartsProps> = ({
  beneficiaries,
  contract,
  payments,
}) => {
  const totalContrato = beneficiaries.reduce((acc, b) => acc + b.contrato, 0);

  // Calcula estritamente pelos status PAGO e PREVISTO
  const paymentsList = payments || [];
  const paidPayments = paymentsList.filter((p) => (p.status?.toString().toUpperCase() || 'PAGO') === 'PAGO');

  const totalRealizado = payments
    ? paidPayments.reduce((acc, p) => acc + p.valor, 0)
    : beneficiaries.reduce((acc, b) => acc + b.pago, 0);

  const totalComprometido = Math.max(0, totalContrato - totalRealizado);

  const percRealizado = totalContrato > 0 ? (totalRealizado / totalContrato) * 100 : 0;
  const percComprometido = totalContrato > 0 ? (totalComprometido / totalContrato) * 100 : 0;

  // Parâmetros do Gráfico de Rosca Ampliado
  // Centro = (380, 185) no canvas de 760 x 370
  // Raio = 112px (Diâmetro do furo interno = 200px) oferecendo amplo espaço livre
  const cx = 380;
  const cy = 185;
  const radius = 112;
  const strokeWidth = 24;
  const circumference = 2 * Math.PI * radius; // ~703.72
  const strokePaid = (percRealizado / 100) * circumference;
  const strokePending = (percComprometido / 100) * circumference;

  // Coordenadas das Linhas Guia (Leader Lines)
  // Comprometido (topo-esquerdo, ~327°)
  const compAnchorX = 313;
  const compAnchorY = 81;
  const compElbowX = 225;
  const compElbowY = 52;
  const compEndX = 182;
  const compEndY = 52;

  // Realizado (baixo-direito, ~142°)
  const realAnchorX = 456;
  const realAnchorY = 283;
  const realElbowX = 535;
  const realElbowY = 312;
  const realEndX = 578;
  const realEndY = 312;

  // Tamanho único de fonte para todas as linhas nos balões
  const BALLOON_FONT_SIZE = 14;

  // Tamanho único de fonte para o centro (texto e valor em R$)
  const CENTER_FONT_SIZE = 15;
  const SANS_FONT_FAMILY =
    'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
      {/* Cabeçalho Limpo */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <PieChartIcon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 tracking-tight">
              Execução Financeira Global
            </h3>
            <p className="text-[11px] text-slate-500">
              {contract?.tituloContrato || 'Contrato de Cessão Hereditária'} • {beneficiaries.length} Cedentes
            </p>
          </div>
        </div>
      </div>

      {/* Canvas Vetorial do Gráfico de Rosca Ampliado */}
      <div className="w-full max-w-4xl mx-auto flex flex-col items-center justify-center py-2">
        <svg
          viewBox="0 0 760 370"
          className="w-full h-auto max-h-[380px] select-none overflow-visible"
        >
          <defs>
            {/* Sombra suave para os balões de chamada */}
            <filter id="badgeShadow" x="-10%" y="-10%" width="125%" height="125%">
              <feDropShadow dx="0" dy="2" stdDeviation="3.5" floodOpacity="0.07" />
            </filter>
          </defs>

          {/* ================================================================= */}
          {/* 1. LINHAS GUIA E BALÕES (TODAS AS LINHAS COM MESMO TAMANHO FONTE) */}
          {/* ================================================================= */}

          {/* Linha Guia: COMPROMETIDO (Amarelo) */}
          <g className="transition-all duration-500">
            {/* Ponto de ancoragem no arco */}
            <circle
              cx={compAnchorX}
              cy={compAnchorY}
              r="4"
              fill={COLOR_COMPROMETIDO}
              stroke="#ffffff"
              strokeWidth="1.75"
            />
            {/* Linha com cotovelo */}
            <polyline
              points={`${compAnchorX},${compAnchorY} ${compElbowX},${compElbowY} ${compEndX},${compEndY}`}
              fill="none"
              stroke={COLOR_COMPROMETIDO}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Balão: COMPROMETIDO (Nome, Porcentagem e R$ com o MESMO tamanho de fonte: 14px) */}
            <g transform={`translate(${compEndX - 172}, ${compEndY - 39})`}>
              <rect
                x="0"
                y="0"
                width="170"
                height="78"
                rx="10"
                fill="#ffffff"
                stroke="#fde68a" // amber-200
                strokeWidth="1.5"
                filter="url(#badgeShadow)"
              />
              <rect
                x="0"
                y="0"
                width="5"
                height="78"
                rx="2"
                fill={COLOR_COMPROMETIDO}
              />
              {/* Linha 1: Nome */}
              <text
                x="15"
                y="23"
                fill="#92400e" // amber-800
                fontSize={BALLOON_FONT_SIZE}
                fontWeight="800"
                fontFamily={SANS_FONT_FAMILY}
                letterSpacing="0.04em"
              >
                COMPROMETIDO
              </text>
              {/* Linha 2: Porcentagem */}
              <text
                x="15"
                y="45"
                fill={COLOR_COMPROMETIDO}
                fontSize={BALLOON_FONT_SIZE}
                fontWeight="800"
                fontFamily={SANS_FONT_FAMILY}
              >
                {percComprometido.toFixed(1)}%
              </text>
              {/* Linha 3: Valor em R$ */}
              <text
                x="15"
                y="67"
                fill="#0f172a" // slate-900
                fontSize={BALLOON_FONT_SIZE}
                fontWeight="800"
                fontFamily={SANS_FONT_FAMILY}
              >
                R$ {formatarNumeroMoeda(totalComprometido)}
              </text>
            </g>
          </g>

          {/* Linha Guia: REALIZADO (Verde) */}
          <g className="transition-all duration-500">
            {/* Ponto de ancoragem no arco */}
            <circle
              cx={realAnchorX}
              cy={realAnchorY}
              r="4"
              fill={COLOR_REALIZADO}
              stroke="#ffffff"
              strokeWidth="1.75"
            />
            {/* Linha com cotovelo */}
            <polyline
              points={`${realAnchorX},${realAnchorY} ${realElbowX},${realElbowY} ${realEndX},${realEndY}`}
              fill="none"
              stroke={COLOR_REALIZADO}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Balão: REALIZADO (Nome, Porcentagem e R$ com o MESMO tamanho de fonte: 14px) */}
            <g transform={`translate(${realEndX + 2}, ${realEndY - 39})`}>
              <rect
                x="0"
                y="0"
                width="170"
                height="78"
                rx="10"
                fill="#ffffff"
                stroke="#a7f3d0" // emerald-200
                strokeWidth="1.5"
                filter="url(#badgeShadow)"
              />
              <rect
                x="0"
                y="0"
                width="5"
                height="78"
                rx="2"
                fill={COLOR_REALIZADO}
              />
              {/* Linha 1: Nome */}
              <text
                x="15"
                y="23"
                fill="#065f46" // emerald-800
                fontSize={BALLOON_FONT_SIZE}
                fontWeight="800"
                fontFamily={SANS_FONT_FAMILY}
                letterSpacing="0.04em"
              >
                REALIZADO (PAGO)
              </text>
              {/* Linha 2: Porcentagem */}
              <text
                x="15"
                y="45"
                fill={COLOR_REALIZADO}
                fontSize={BALLOON_FONT_SIZE}
                fontWeight="800"
                fontFamily={SANS_FONT_FAMILY}
              >
                {percRealizado.toFixed(1)}%
              </text>
              {/* Linha 3: Valor em R$ */}
              <text
                x="15"
                y="67"
                fill="#0f172a" // slate-900
                fontSize={BALLOON_FONT_SIZE}
                fontWeight="800"
                fontFamily={SANS_FONT_FAMILY}
              >
                R$ {formatarNumeroMoeda(totalRealizado)}
              </text>
            </g>
          </g>

          {/* ================================================================= */}
          {/* 2. ANEL DE ROSCA (TRAÇADO ESPESSO E ARREDONDADO)                  */}
          {/* ================================================================= */}
          <g transform={`rotate(-90 ${cx} ${cy})`}>
            {/* Pista de fundo cinza suave */}
            <circle
              cx={cx}
              cy={cy}
              r={radius}
              stroke="#f1f5f9"
              strokeWidth={strokeWidth}
              fill="transparent"
            />

            {/* Segmento Realizado (Verde Esmeralda) */}
            <circle
              cx={cx}
              cy={cy}
              r={radius}
              stroke={COLOR_REALIZADO}
              strokeWidth={strokeWidth}
              fill="transparent"
              strokeDasharray={`${strokePaid} ${circumference}`}
              strokeLinecap="round"
              className="transition-all duration-700 ease-out"
            />

            {/* Segmento Comprometido (Amarelo Âmbar) */}
            {percComprometido > 0 && (
              <circle
                cx={cx}
                cy={cy}
                r={radius}
                stroke={COLOR_COMPROMETIDO}
                strokeWidth={strokeWidth}
                fill="transparent"
                strokeDasharray={`${strokePending} ${circumference}`}
                strokeDashoffset={-strokePaid}
                strokeLinecap="round"
                className="transition-all duration-700 ease-out"
              />
            )}
          </g>

          {/* ================================================================= */}
          {/* 3. CENTRO: TEXTO E VALOR EM R$ IDÊNTICOS EM TAMANHO, FONTE E COR  */}
          {/* ================================================================= */}
          <g textAnchor="middle" className="pointer-events-none">
            {/* TOTAL DO CONTRATO: 15px, sans-serif, bold, preto */}
            <text
              x={cx}
              y={cy - 10}
              fill="#0f172a"
              fontSize={CENTER_FONT_SIZE}
              fontWeight="800"
              fontFamily={SANS_FONT_FAMILY}
              letterSpacing="0.03em"
            >
              TOTAL DO CONTRATO
            </text>
            {/* Valor em R$: Exatamente 15px, sans-serif, bold, preto */}
            <text
              x={cx}
              y={cy + 14}
              fill="#0f172a"
              fontSize={CENTER_FONT_SIZE}
              fontWeight="800"
              fontFamily={SANS_FONT_FAMILY}
              letterSpacing="0.02em"
            >
              R$ {formatarNumeroMoeda(totalContrato)}
            </text>
          </g>
        </svg>
      </div>
    </div>
  );
};
