using System;
using Avalonia.Controls;
using AppRecibos.Native.ViewModels;

namespace AppRecibos.Native.Views;

public partial class BeneficiaryDialog : Window
{
    public BeneficiaryDialog()
    {
        InitializeComponent();
    }

    public BeneficiaryDialog(BeneficiaryDialogViewModel vm) : this()
    {
        DataContext = vm;
        vm.RequestClose += () => Close(vm.IsConfirmed);
    }
}
