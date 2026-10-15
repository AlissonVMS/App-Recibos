using System;
using Avalonia.Controls;
using Avalonia.Input;
using AppRecibos.Native.ViewModels;

namespace AppRecibos.Native.Views;

public partial class ReceiptPreviewDialog : Window
{
    public ReceiptPreviewDialog()
    {
        InitializeComponent();
    }

    public ReceiptPreviewDialog(ReceiptPreviewDialogViewModel vm) : this()
    {
        DataContext = vm;
        vm.RequestClose += () => Close();

        KeyDown += (s, e) =>
        {
            if (e.Key == Key.Escape)
            {
                Close();
            }
        };
    }
}
