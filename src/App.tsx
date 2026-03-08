import { useEffect, useMemo, useState } from 'react'

type Entry = {
  id: string
  text: string
  amount: number
  type: 'Einnahme' | 'Ausgabe'
  createdAt: string
}

const STORAGE_KEY = 'haushaltsbuch-eintraege-v1'

export default function App() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [text, setText] = useState('')
  const [amount, setAmount] = useState('')
  const [type, setType] = useState<Entry['type']>('Ausgabe')

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return
    try {
      const parsed = JSON.parse(saved) as Entry[]
      setEntries(parsed)
    } catch (error) {
      console.error('Konnte gespeicherte Daten nicht laden:', error)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
  }, [entries])

  const addEntry = () => {
    const numericAmount = Number(amount)
    if (!text.trim() || !Number.isFinite(numericAmount) || numericAmount <= 0) return

    const entry: Entry = {
      id: crypto.randomUUID(),
      text: text.trim(),
      amount: numericAmount,
      type,
      createdAt: new Date().toISOString(),
    }

    setEntries((current) => [entry, ...current])
    setText('')
    setAmount('')
    setType('Ausgabe')
  }

  const removeEntry = (id: string) => {
    setEntries((current) => current.filter((entry) => entry.id !== id))
  }

  const totals = useMemo(() => {
    const income = entries
      .filter((entry) => entry.type === 'Einnahme')
      .reduce((sum, entry) => sum + entry.amount, 0)

    const expenses = entries
      .filter((entry) => entry.type === 'Ausgabe')
      .reduce((sum, entry) => sum + entry.amount, 0)

    return {
      income,
      expenses,
      balance: income - expenses,
    }
  }, [entries])

  return (
    <main className="app-shell">
      <section className="card hero">
        <div>
          <p className="eyebrow">PWA</p>
          <h1>Haushaltsbuch</h1>
          <p className="subtitle">
            Einnahmen und Ausgaben lokal speichern – auch installierbar als App.
          </p>
        </div>
        <div className="stats">
          <article>
            <span>Kontostand</span>
            <strong>{formatCurrency(totals.balance)}</strong>
          </article>
          <article>
            <span>Einnahmen</span>
            <strong>{formatCurrency(totals.income)}</strong>
          </article>
          <article>
            <span>Ausgaben</span>
            <strong>{formatCurrency(totals.expenses)}</strong>
          </article>
        </div>
      </section>

      <section className="card form-card">
        <h2>Neuer Eintrag</h2>
        <div className="form-grid">
          <label>
            <span>Beschreibung</span>
            <input
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="z. B. Supermarkt"
            />
          </label>

          <label>
            <span>Betrag</span>
            <input
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              placeholder="0,00"
            />
          </label>

          <label>
            <span>Typ</span>
            <select value={type} onChange={(event) => setType(event.target.value as Entry['type'])}>
              <option value="Ausgabe">Ausgabe</option>
              <option value="Einnahme">Einnahme</option>
            </select>
          </label>

          <button className="primary-button" onClick={addEntry}>
            Eintrag speichern
          </button>
        </div>
      </section>

      <section className="card list-card">
        <div className="list-header">
          <h2>Einträge</h2>
          <span>{entries.length} gesamt</span>
        </div>

        {entries.length === 0 ? (
          <p className="empty-state">Noch keine Einträge vorhanden.</p>
        ) : (
          <ul className="entry-list">
            {entries.map((entry) => (
              <li key={entry.id} className="entry-item">
                <div>
                  <strong>{entry.text}</strong>
                  <small>
                    {entry.type} · {new Date(entry.createdAt).toLocaleDateString('de-DE')}
                  </small>
                </div>
                <div className="entry-actions">
                  <span className={entry.type === 'Einnahme' ? 'income' : 'expense'}>
                    {entry.type === 'Einnahme' ? '+' : '-'}
                    {formatCurrency(entry.amount)}
                  </span>
                  <button onClick={() => removeEntry(entry.id)} aria-label="Eintrag löschen">
                    Löschen
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(value)
}
