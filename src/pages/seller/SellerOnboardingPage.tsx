import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Store, ShieldCheck, CheckCircle2, ArrowRight } from 'lucide-react'
import { ShopAPI, ActivationAPI } from '@/lib/store'
import { CITIES_CAMEROON, CATEGORIES } from '@/types'
import { Button } from '@/components/ui/Button'
import { Input, Textarea, Select } from '@/components/ui/Input'
import { useAuth } from '@/hooks/useAuth'
import { toastSuccess, toastError } from '@/components/ui/Toast'

export default function SellerOnboardingPage() {
  const { user, setRole } = useAuth()
  const navigate = useNavigate()

  const [shopName, setShopName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('Électronique')
  const [city, setCity] = useState('Yaoundé')
  const [whatsapp, setWhatsapp] = useState('')
  const [mtnNumber, setMtnNumber] = useState('')
  const [orangeNumber, setOrangeNumber] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!shopName || !whatsapp) {
      toastError('Veuillez remplir le nom et le numéro WhatsApp.')
      return
    }

    setLoading(true)
    await new Promise(r => setTimeout(r, 600))

    const newShop = ShopAPI.create({
      name: shopName,
      description: description || 'Boutique certifiée sur MarchéPlus.',
      owner_name: user?.name || 'Vendeur',
      owner_email: user?.email || 'vendeur@demo.cm',
      owner_id: user?.id || 'demo-seller',
      shop_type: 'individual',
      status: 'active',
      category,
      city,
      whatsapp_number: whatsapp,
      mtn_number: mtnNumber || undefined,
      orange_number: orangeNumber || undefined,
    })

    ActivationAPI.create({
      user_name: user?.name || 'Vendeur',
      user_email: user?.email || 'vendeur@demo.cm',
      shop_name: shopName,
      shop_id: newShop.id,
      shop_type: 'individual',
      payment_method: paymentMethod,
      amount: 1000,
      status: 'verified',
    })

    setRole('seller')
    setLoading(false)
    toastSuccess('Félicitations ! Votre boutique est active !')
    navigate('/seller')
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
      <div className="text-center space-y-3">
        <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center text-white mx-auto shadow-md">
          <Store className="w-7 h-7" />
        </div>
        <h1 className="text-3xl font-display font-extrabold text-foreground">Ouverture de votre Boutique</h1>
        <p className="text-sm text-muted-foreground">Rejoignez les étudiants entrepreneurs du Cameroun et commencez à vendre dès aujourd'hui.</p>
      </div>

      <div className="card-glass p-8 space-y-6 shadow-xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Nom de votre boutique / vitrine" placeholder="Ex: TechHub Yaoundé" required value={shopName} onChange={e => setShopName(e.target.value)} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Catégorie principale"
              value={category}
              onChange={e => setCategory(e.target.value)}
              options={CATEGORIES.filter(c => c !== 'Toutes').map(c => ({ value: c, label: c }))}
            />
            <Select
              label="Ville de localisation"
              value={city}
              onChange={e => setCity(e.target.value)}
              options={CITIES_CAMEROON.map(c => ({ value: c, label: c }))}
            />
          </div>

          <Input label="Numéro WhatsApp Vendeur (pour alerte automatique)" placeholder="Ex: 680195221" required value={whatsapp} onChange={e => setWhatsapp(e.target.value)} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Numéro MTN Mobile Money Vendeur (optionnel)" placeholder="Ex: 680195221" value={mtnNumber} onChange={e => setMtnNumber(e.target.value)} />
            <Input label="Numéro Orange Money Vendeur (optionnel)" placeholder="Ex: 691576677" value={orangeNumber} onChange={e => setOrangeNumber(e.target.value)} />
          </div>

          <Textarea label="Description de vos activités" rows={3} placeholder="Présentez brièvement ce que vous vendez..." value={description} onChange={e => setDescription(e.target.value)} />

          <Button type="submit" loading={loading} className="w-full justify-center py-3">
            Créer et Activer ma Boutique <ArrowRight className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}
