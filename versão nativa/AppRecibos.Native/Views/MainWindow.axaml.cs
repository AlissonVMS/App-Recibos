using System;
using System.Threading.Tasks;
using Avalonia.Controls;
using AppRecibos.Core.Domain.Entities;
using AppRecibos.Native.Services;
using AppRecibos.Native.ViewModels;

namespace AppRecibos.Native.Views;

public partial class MainWindow : Window
{
    public MainWindow()
    {
        InitializeComponent();
    }

    protected override void OnDataContextChanged(EventArgs e)
    {
        base.OnDataContextChanged(e);

        if (DataContext is MainWindowViewModel vm)
        {
            // Modais e Diálogos ocorrem dentro da própria janela principal em overlay (1:1 ao React, sem novas janelas do SO)
            vm.OnRequestPaymentDialog = null;
            vm.OnRequestBeneficiaryDialog = null;
            vm.OnRequestReceiptPreviewDialog = null;

            // Tecla ESC fecha qualquer modal/overlay aberto e retorna imediatamente à janela principal
            AddHandler(KeyDownEvent, (s, e) =>
            {
                if (e.Key == Avalonia.Input.Key.Escape)
                {
                    if (DataContext is MainWindowViewModel mvm)
                    {
                        if (mvm.IsConfirmDialogOpen)
                        {
                            mvm.CancelConfirmCommand.Execute(null);
                            e.Handled = true;
                        }
                        else if (mvm.IsPaymentDialogOpen)
                        {
                            mvm.ClosePaymentDialogCommand.Execute(null);
                            e.Handled = true;
                        }
                        else if (mvm.IsBeneficiaryDialogOpen)
                        {
                            mvm.CloseBeneficiaryDialogCommand.Execute(null);
                            e.Handled = true;
                        }
                        else if (mvm.IsReceiptPreviewOpen)
                        {
                            mvm.CloseReceiptPreviewCommand.Execute(null);
                            e.Handled = true;
                        }
                    }
                }
            }, Avalonia.Interactivity.RoutingStrategies.Tunnel);

            vm.OnRequestSaveFileDialog = async (title, defaultFileName, extension, filterName) =>
            {
                return await NativeDialogService.ShowSaveFileDialogAsync(this, title, defaultFileName, extension, filterName);
            };

            vm.OnOpenFilePath = (filePath) =>
            {
                NativeDialogService.OpenPathWithDefaultApp(filePath);
            };
        }
    }
}
