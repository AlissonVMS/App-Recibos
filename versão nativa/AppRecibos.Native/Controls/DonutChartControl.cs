using System;
using System.Globalization;
using Avalonia;
using Avalonia.Controls;
using Avalonia.Media;

namespace AppRecibos.Native.Controls;

public class DonutChartControl : Control
{
    public static readonly StyledProperty<decimal> TotalAmountProperty =
        AvaloniaProperty.Register<DonutChartControl, decimal>(nameof(TotalAmount), 90000m);

    public static readonly StyledProperty<decimal> PaidAmountProperty =
        AvaloniaProperty.Register<DonutChartControl, decimal>(nameof(PaidAmount), 40000m);

    public static readonly StyledProperty<decimal> PendingAmountProperty =
        AvaloniaProperty.Register<DonutChartControl, decimal>(nameof(PendingAmount), 50000m);

    public decimal TotalAmount
    {
        get => GetValue(TotalAmountProperty);
        set => SetValue(TotalAmountProperty, value);
    }

    public decimal PaidAmount
    {
        get => GetValue(PaidAmountProperty);
        set => SetValue(PaidAmountProperty, value);
    }

    public decimal PendingAmount
    {
        get => GetValue(PendingAmountProperty);
        set => SetValue(PendingAmountProperty, value);
    }

    static DonutChartControl()
    {
        AffectsRender<DonutChartControl>(TotalAmountProperty, PaidAmountProperty, PendingAmountProperty);
    }

    public override void Render(DrawingContext context)
    {
        base.Render(context);

        double w = Bounds.Width;
        double h = Bounds.Height;
        if (w <= 0 || h <= 0) return;

        // ViewBox de referência do React: 760 x 370
        const double baseWidth = 760.0;
        const double baseHeight = 370.0;

        double scale = Math.Min(w / baseWidth, h / baseHeight);
        if (scale <= 0) return;

        double contentW = baseWidth * scale;
        double contentH = baseHeight * scale;
        double offsetX = (w - contentW) / 2.0;
        double offsetY = (h - contentH) / 2.0;

        // Matriz de escala e centralização proporcional
        var transform = Matrix.CreateScale(scale, scale) * Matrix.CreateTranslation(offsetX, offsetY);
        using (context.PushTransform(transform))
        {
            RenderChart760x370(context);
        }
    }

    private void RenderChart760x370(DrawingContext context)
    {
        const double cx = 380.0;
        const double cy = 185.0;
        const double radius = 112.0;
        const double strokeWidth = 24.0;

        decimal total = TotalAmount > 0 ? TotalAmount : 90000m;
        decimal paid = PaidAmount;
        decimal pending = PendingAmount > 0 ? PendingAmount : Math.Max(0, total - paid);

        double paidPct = total > 0 ? (double)(paid / total) : 0;
        double pendingPct = total > 0 ? (double)(pending / total) : 0;

        var bgPen = new Pen(new SolidColorBrush(Color.Parse("#F1F5F9")), strokeWidth);
        var paidBrush = new SolidColorBrush(Color.Parse("#10B981"));
        var pendingBrush = new SolidColorBrush(Color.Parse("#F59E0B"));

        var paidPen = new Pen(paidBrush, strokeWidth, lineCap: PenLineCap.Round);
        var pendingPen = new Pen(pendingBrush, strokeWidth, lineCap: PenLineCap.Round);

        // 1. Círculo de fundo da rosca
        context.DrawEllipse(null, bgPen, new Point(cx, cy), radius, radius);

        // 2. Segmentos da rosca (iniciando em -90 graus / topo)
        double startAngle = -90.0;
        double paidSweep = paidPct * 360.0;
        double pendingSweep = pendingPct * 360.0;

        if (paidSweep > 0)
        {
            DrawArc(context, new Point(cx, cy), radius, startAngle, paidSweep, paidPen);
        }
        if (pendingSweep > 0)
        {
            DrawArc(context, new Point(cx, cy), radius, startAngle + paidSweep, pendingSweep, pendingPen);
        }

        // 3. Textos Centrais (15px, sans-serif, bold, #0F172A)
        var culture = new CultureInfo("pt-BR");
        var typefaceBold = new Typeface(FontFamily.Default, FontStyle.Normal, FontWeight.ExtraBold);

        var titleText = new FormattedText(
            "TOTAL DO CONTRATO",
            culture,
            FlowDirection.LeftToRight,
            typefaceBold,
            15.0,
            new SolidColorBrush(Color.Parse("#0F172A"))
        );
        context.DrawText(titleText, new Point(cx - titleText.Width / 2, cy - 14));

        string totalFormatted = "R$ " + total.ToString("N2", culture);
        var valText = new FormattedText(
            totalFormatted,
            culture,
            FlowDirection.LeftToRight,
            typefaceBold,
            15.0,
            new SolidColorBrush(Color.Parse("#0F172A"))
        );
        context.DrawText(valText, new Point(cx - valText.Width / 2, cy + 8));

        // 4. BALÃO E LINHA GUIA: COMPROMETIDO (Amarelo Âmbar no Canto Superior Esquerdo)
        // Coordenadas fiéis do React: anchor (313, 81) -> cotovelo (225, 52) -> término (182, 52)
        const double compAnchorX = 313.0;
        const double compAnchorY = 81.0;
        const double compElbowX = 225.0;
        const double compElbowY = 52.0;
        const double compEndX = 182.0;
        const double compEndY = 52.0;

        // Ponto de ancoragem no arco com anel branco
        context.DrawEllipse(pendingBrush, new Pen(new SolidColorBrush(Colors.White), 1.75), new Point(compAnchorX, compAnchorY), 4.0, 4.0);

        // Linha com cotovelo
        var guideGeomLeft = new StreamGeometry();
        using (var sgc = guideGeomLeft.Open())
        {
            sgc.BeginFigure(new Point(compAnchorX, compAnchorY), false);
            sgc.LineTo(new Point(compElbowX, compElbowY));
            sgc.LineTo(new Point(compEndX, compEndY));
        }
        context.DrawGeometry(null, new Pen(pendingBrush, 2.0, lineCap: PenLineCap.Round, lineJoin: PenLineJoin.Round), guideGeomLeft);

        // Balão Comprometido: x = 10, y = 13, w = 170, h = 78
        double compBoxX = compEndX - 172.0; // 10.0
        double compBoxY = compEndY - 39.0;  // 13.0
        string compPctStr = (pendingPct * 100.0).ToString("0.0", CultureInfo.InvariantCulture) + "%";
        DrawBalloonCard(context, compBoxX, compBoxY, 170.0, 78.0,
            "COMPROMETIDO",
            compPctStr,
            "R$ " + pending.ToString("N2", culture),
            Color.Parse("#F59E0B"),
            Color.Parse("#92400E"),
            Color.Parse("#FDE68A"));

        // 5. BALÃO E LINHA GUIA: REALIZADO (Verde Esmeralda no Canto Inferior Direito)
        // Coordenadas fiéis do React: anchor (456, 283) -> cotovelo (535, 312) -> término (578, 312)
        const double realAnchorX = 456.0;
        const double realAnchorY = 283.0;
        const double realElbowX = 535.0;
        const double realElbowY = 312.0;
        const double realEndX = 578.0;
        const double realEndY = 312.0;

        // Ponto de ancoragem no arco com anel branco
        context.DrawEllipse(paidBrush, new Pen(new SolidColorBrush(Colors.White), 1.75), new Point(realAnchorX, realAnchorY), 4.0, 4.0);

        // Linha com cotovelo
        var guideGeomRight = new StreamGeometry();
        using (var sgc = guideGeomRight.Open())
        {
            sgc.BeginFigure(new Point(realAnchorX, realAnchorY), false);
            sgc.LineTo(new Point(realElbowX, realElbowY));
            sgc.LineTo(new Point(realEndX, realEndY));
        }
        context.DrawGeometry(null, new Pen(paidBrush, 2.0, lineCap: PenLineCap.Round, lineJoin: PenLineJoin.Round), guideGeomRight);

        // Balão Realizado: x = 580, y = 273, w = 170, h = 78
        double realBoxX = realEndX + 2.0;   // 580.0
        double realBoxY = realEndY - 39.0;  // 273.0
        string realPctStr = (paidPct * 100.0).ToString("0.0", CultureInfo.InvariantCulture) + "%";
        DrawBalloonCard(context, realBoxX, realBoxY, 170.0, 78.0,
            "REALIZADO (PAGO)",
            realPctStr,
            "R$ " + paid.ToString("N2", culture),
            Color.Parse("#10B981"),
            Color.Parse("#065F46"),
            Color.Parse("#A7F3D0"));
    }

    private void DrawBalloonCard(DrawingContext ctx, double x, double y, double width, double height,
        string tag, string pct, string amount, Color accentColor, Color textColor, Color borderLight)
    {
        // Sombra suave (DropShadow)
        var shadowRect = new Rect(x, y + 2, width, height);
        ctx.DrawRectangle(new SolidColorBrush(Color.FromArgb(14, 0, 0, 0)), null, shadowRect, 10, 10);

        var rect = new Rect(x, y, width, height);
        // Fundo branco com borda suave
        ctx.DrawRectangle(new SolidColorBrush(Colors.White), new Pen(new SolidColorBrush(borderLight), 1.5), rect, 10, 10);

        // Faixa de destaque lateral colorida (w=5, h=78, rx=2)
        ctx.DrawRectangle(new SolidColorBrush(accentColor), null, new Rect(x, y, 5, height), 2, 2);

        var culture = new CultureInfo("pt-BR");
        var typefaceBold = new Typeface(FontFamily.Default, FontStyle.Normal, FontWeight.ExtraBold);

        // Linha 1: Tag (COMPROMETIDO / REALIZADO (PAGO))
        var tagText = new FormattedText(tag, culture, FlowDirection.LeftToRight,
            typefaceBold, 14.0, new SolidColorBrush(textColor));
        ctx.DrawText(tagText, new Point(x + 15, y + 8));

        // Linha 2: Porcentagem
        var pctText = new FormattedText(pct, culture, FlowDirection.LeftToRight,
            typefaceBold, 14.0, new SolidColorBrush(accentColor));
        ctx.DrawText(pctText, new Point(x + 15, y + 29));

        // Linha 3: Valor
        var amountText = new FormattedText(amount, culture, FlowDirection.LeftToRight,
            typefaceBold, 14.0, new SolidColorBrush(Color.Parse("#0F172A")));
        ctx.DrawText(amountText, new Point(x + 15, y + 50));
    }

    private static void DrawArc(DrawingContext context, Point center, double radius, double startAngleDeg, double sweepAngleDeg, Pen pen)
    {
        if (sweepAngleDeg <= 0) return;
        if (sweepAngleDeg >= 360) sweepAngleDeg = 359.99;

        var startPt = GetPointOnCircle(center, radius, startAngleDeg);
        var endPt = GetPointOnCircle(center, radius, startAngleDeg + sweepAngleDeg);

        var geom = new StreamGeometry();
        using (var ctx = geom.Open())
        {
            ctx.BeginFigure(startPt, false);
            bool isLargeArc = sweepAngleDeg > 180.0;
            ctx.ArcTo(endPt, new Size(radius, radius), 0, isLargeArc, SweepDirection.Clockwise);
        }

        context.DrawGeometry(null, pen, geom);
    }

    private static Point GetPointOnCircle(Point center, double radius, double angleDeg)
    {
        double rad = angleDeg * Math.PI / 180.0;
        return new Point(center.X + radius * Math.Cos(rad), center.Y + radius * Math.Sin(rad));
    }
}
