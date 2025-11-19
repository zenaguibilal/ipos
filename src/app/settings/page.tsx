'use client';

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "next-themes";
import { usePassword } from "@/components/auth/password-provider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Palette, Lock, Store } from "lucide-react";

function ChangePasswordForm() {
    const { changePassword } = usePassword();
    const { toast } = useToast();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (newPassword !== confirmPassword) {
            setError('Les nouveaux mots de passe ne correspondent pas.');
            return;
        }
        if (newPassword.length < 4) {
            setError('Le nouveau mot de passe doit contenir au moins 4 caractères.');
            return;
        }

        setIsLoading(true);
        const success = changePassword(currentPassword, newPassword);
        setIsLoading(false);

        if (success) {
            toast({
                title: "Mot de passe modifié",
                description: "Votre mot de passe a été mis à jour avec succès.",
            });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } else {
            setError('Le mot de passe actuel est incorrect.');
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="current-password">Mot de passe actuel</Label>
                <Input
                    id="current-password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                />
            </div>
             <div className="space-y-2">
                <Label htmlFor="new-password">Nouveau mot de passe</Label>
                <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                />
            </div>
             <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirmer le nouveau mot de passe</Label>
                <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Modification en cours...' : 'Changer le mot de passe'}
            </Button>
        </form>
    )
}

function StoreInfoForm() {
    const { toast } = useToast();
    const [storeName, setStoreName] = useState('');
    const [storeAddress, setStoreAddress] = useState('');
    const [storePhone, setStorePhone] = useState('');
    const [storeEmail, setStoreEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const info = {
            name: localStorage.getItem('storeName') || '',
            address: localStorage.getItem('storeAddress') || '',
            phone: localStorage.getItem('storePhone') || '',
            email: localStorage.getItem('storeEmail') || '',
        };
        setStoreName(info.name);
        setStoreAddress(info.address);
        setStorePhone(info.phone);
        setStoreEmail(info.email);
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        localStorage.setItem('storeName', storeName);
        localStorage.setItem('storeAddress', storeAddress);
        localStorage.setItem('storePhone', storePhone);
        localStorage.setItem('storeEmail', storeEmail);
        setIsLoading(false);
        toast({
            title: "Enregistré",
            description: "Les informations du magasin ont été mises à jour avec succès.",
        });
    }

    return (
         <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="store-name">Nom du magasin</Label>
                <Input
                    id="store-name"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                />
            </div>
             <div className="space-y-2">
                <Label htmlFor="store-address">Adresse du magasin</Label>
                <Input
                    id="store-address"
                    value={storeAddress}
                    onChange={(e) => setStoreAddress(e.target.value)}
                />
            </div>
             <div className="space-y-2">
                <Label htmlFor="store-phone">Numéro de téléphone</Label>
                <Input
                    id="store-phone"
                    type="tel"
                    value={storePhone}
                    onChange={(e) => setStorePhone(e.target.value)}
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="store-email">Email</Label>
                <Input
                    id="store-email"
                    type="email"
                    value={storeEmail}
                    onChange={(e) => setStoreEmail(e.target.value)}
                />
            </div>
            <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Enregistrement...' : 'Enregistrer les informations'}
            </Button>
        </form>
    );
}

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-6">
       <div className="grid gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Paramètres</h1>
            <p className="text-muted-foreground">
                Gérez les paramètres et les préférences de votre application.
            </p>
        </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette />
            Apparence
          </CardTitle>
          <CardDescription>
            Personnalisez l'apparence de l'application. Basculez entre le mode clair et le mode sombre.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <Label htmlFor="dark-mode-switch">Mode sombre</Label>
            <Switch
              id="dark-mode-switch"
              checked={theme === 'dark'}
              onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock />
            Sécurité
            </CardTitle>
          <CardDescription>
            Changez le mot de passe principal pour accéder à l'application.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store />
            Informations sur le magasin
            </CardTitle>
          <CardDescription>
            Définissez les détails de base de votre magasin à utiliser sur les factures.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StoreInfoForm />
        </CardContent>
      </Card>
    </div>
  );
}
