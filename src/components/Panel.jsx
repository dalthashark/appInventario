import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertCircle,
  ArrowDownLeft,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  CirclePlus,
  ClipboardList,
  Eye,
  Layers3,
  Package,
  Pencil,
  RotateCcw,
  Search,
  Settings2,
  Trash2,
  Truck,
  X,
} from 'lucide-react'
import api from '../services/api'

const blankProduct = { nombre: '', descripcion: '', precio: '', categoria_id: '', proveedor_id: '' }
const blankCategory = { nombre: '', descripcion: '' }
const blankSupplier = { razon_social: '', contacto: '', telefono: '', email: '' }
const blankMovement = { producto_id: '', usuario_id: '', tipo_movimiento: 'Entrada', cantidad: '', observaciones: '' }
const chartPalette = ['#4f82df', '#e98038', '#42b990', '#8c65c5', '#d95d78', '#37aeb8', '#e5bf48', '#6c7fce']
const PAGE_SIZE = 5

function useCollection(endpoint) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let active = true
    api.get(endpoint)
      .then(({ data: result }) => { if (active) { setData(result); setError('') } })
      .catch(() => { if (active) setError(`No se pudo cargar ${endpoint.replace('/', '')}. Comprueba que la API esté activa.`) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [endpoint, version])

  return {
    data,
    loading,
    error,
    reload: () => {
      setLoading(true)
      setVersion((value) => value + 1)
    },
  }
}

function PageHeading({ eyebrow, title, detail, action }) {
  return <div className="page-heading"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p className="page-detail">{detail}</p></div>{action}</div>
}

function Notice({ children, error = false }) {
  if (!children) return null
  return <div className={`notice${error ? ' notice-error' : ''}`} role="status">{error && <AlertCircle size={16} />}{children}</div>
}

function LoadingOrError({ loading, error }) {
  if (loading) return <div className="table-message">Cargando información...</div>
  if (error) return <div className="table-message error-message"><AlertCircle size={17} />{error}</div>
  return null
}

function EmptyRow({ columns, children = 'Aún no hay registros.' }) {
  return <tr><td colSpan={columns} className="empty-cell">{children}</td></tr>
}

function formatPrice(price) {
  return `S/ ${Number(price || 0).toFixed(2)}`
}

function formatId(id) {
  return String(id).padStart(3, '0')
}

function usePagedResults(items, matches) {
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const filtered = items.filter((item) => matches(item, query.trim().toLocaleLowerCase('es-PE')))
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const updateQuery = (value) => {
    setQuery(value)
    setPage(1)
  }

  return { query, updateQuery, page: currentPage, setPage, pageCount, filtered, visible }
}

function SearchInput({ value, onChange, placeholder }) {
  return <label className="search-box"><Search size={15} /><input type="search" value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} aria-label={placeholder} /></label>
}

function Pagination({ page, pageCount, total, onPageChange }) {
  const first = total ? (page - 1) * PAGE_SIZE + 1 : 0
  const last = Math.min(page * PAGE_SIZE, total)
  const pages = Array.from({ length: pageCount }, (_, index) => index + 1)

  return <div className="table-footer"><span>Mostrando {first}-{last} de {total} registros</span><nav className="pagination" aria-label="Paginación">
    <button className="page-button" type="button" aria-label="Página anterior" disabled={page <= 1} onClick={() => onPageChange(page - 1)}><ChevronLeft size={15} /></button>
    {pages.map((number) => <button key={number} className={`page-button${number === page ? ' current' : ''}`} type="button" aria-current={number === page ? 'page' : undefined} onClick={() => onPageChange(number)}>{number}</button>)}
    <button className="page-button" type="button" aria-label="Página siguiente" disabled={page >= pageCount} onClick={() => onPageChange(page + 1)}><ChevronRight size={15} /></button>
  </nav></div>
}

function Modal({ title, onClose, children }) {
  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
    <section className="form-modal" role="dialog" aria-modal="true" aria-label={title}>
      <div className="section-heading"><div><p className="eyebrow">SENATI · INVENTARIO</p><h2>{title}</h2></div><button className="icon-button" type="button" title="Cerrar" aria-label="Cerrar" onClick={onClose}><X size={17} /></button></div>
      {children}
    </section>
  </div>
}

function Dashboard() {
  const products = useCollection('/productos')
  const categories = useCollection('/categorias')
  const suppliers = useCollection('/proveedores')
  const movements = useCollection('/movimientos')
  const busy = products.loading || categories.loading || suppliers.loading || movements.loading
  const lowStock = products.data.filter((product) => Number(product.stock) <= 5)
  const recent = [...movements.data].slice(0, 5)
  const categoryStock = categories.data.map((category, index) => ({
    id: category.id,
    name: category.nombre,
    stock: products.data
      .filter((product) => String(product.categoria_id) === String(category.id))
      .reduce((total, product) => total + Number(product.stock || 0), 0),
    color: chartPalette[index % chartPalette.length],
  })).filter((category) => category.stock > 0)
  const totalStock = categoryStock.reduce((total, category) => total + category.stock, 0)
  let chartPosition = 0
  const chartBackground = totalStock
    ? `conic-gradient(${categoryStock.map((category) => {
      const start = chartPosition
      chartPosition += (category.stock / totalStock) * 100
      return `${category.color} ${start}% ${chartPosition}%`
    }).join(', ')})`
    : '#e8ecef'

  return <>
    <PageHeading eyebrow="SENATI · SISTEMA DE INVENTARIO" title="Dashboard" detail="Resumen de inventario y actividad reciente." />
    {[products, categories, suppliers, movements].some((item) => item.error) && <Notice error>La API no respondió en alguna vista. Inicia el backend para actualizar los indicadores.</Notice>}
    <section className="kpi-grid" aria-label="Indicadores del inventario">
      <Kpi label="Total Productos" value={busy ? '—' : products.data.length.toLocaleString('es-PE')} icon={Package} tone="blue" />
      <Kpi label="Categorías" value={busy ? '—' : categories.data.length} icon={Layers3} tone="purple" />
      <Kpi label="Proveedores" value={busy ? '—' : suppliers.data.length} icon={Truck} tone="mint" />
      <Kpi label="Bajo Stock (Alertas)" value={busy ? '—' : lowStock.length} icon={AlertCircle} tone="peach" />
    </section>
    <div className="dashboard-grid">
      <section className="surface table-surface">
        <div className="section-heading"><div><p className="eyebrow">KARDEX</p><h2>Movimientos Recientes</h2></div><Link className="text-link" to="/kardex">Ver Kardex <ArrowUpRight size={15} /></Link></div>
        <div className="table-wrap"><table><thead><tr><th>Fecha</th><th>Producto</th><th>Tipo</th><th>Cantidad</th><th>Usuario</th></tr></thead>
          <tbody>{movements.loading ? <EmptyRow columns={5}>Cargando movimientos...</EmptyRow> : recent.length ? recent.map((move) => <MovementRow key={move.id} move={move} />) : <EmptyRow columns={5}>Todavía no hay movimientos de inventario.</EmptyRow>}</tbody>
        </table></div>
      </section>
      <CategoryStockChart items={categoryStock} total={totalStock} background={chartBackground} loading={busy} />
    </div>
  </>
}

function Kpi({ label, value, icon: Icon, tone, foot }) {
  return <article className="kpi-card"><span className={`kpi-icon ${tone}`}><Icon size={18} /></span><span className="kpi-label">{label}</span><strong className="kpi-value">{value}</strong>{foot && <span className="kpi-foot">{foot}</span>}</article>
}

function CategoryStockChart({ items, total, background, loading }) {
  return <section className="surface category-stock-surface">
    <div className="section-heading"><div><p className="eyebrow">DISTRIBUCIÓN</p><h2>Stock por Categoría</h2></div><Layers3 size={17} className="chart-heading-icon" /></div>
    {loading ? <div className="table-message">Cargando inventario...</div> : items.length ? <div className="category-chart-layout">
      <div className="donut-chart" role="img" aria-label={`Distribución de ${total} unidades entre ${items.length} categorías`} style={{ background: background }}>
        <div className="donut-center"><strong>{total.toLocaleString('es-PE')}</strong><small>unidades</small></div>
      </div>
      <ul className="category-legend">{items.map((item) => <li key={item.id}><span className="legend-swatch" style={{ backgroundColor: item.color }} /><span className="legend-name">{item.name}</span><strong>{item.stock}</strong></li>)}</ul>
    </div> : <div className="chart-empty"><Layers3 size={20} /><span>Sin stock por categoría</span><small>Asigna productos y existencias para ver la distribución.</small></div>}
  </section>
}

function MovementRow({ move }) {
  const date = move.fecha_hora ? new Date(move.fecha_hora).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
  return <tr><td>{date}</td><td className="primary-cell">{move.producto?.nombre || `Producto #${move.producto_id}`}</td><td><MovementType type={move.tipo_movimiento} /></td><td className={`movement-quantity ${move.tipo_movimiento === 'Salida' ? 'quantity-out' : 'quantity-in'}`}>{move.tipo_movimiento === 'Salida' ? '−' : '+'}{move.cantidad}</td><td>{move.usuario?.nombre || `Usuario #${move.usuario_id}`}</td></tr>
}

function MovementType({ type }) {
  const isEntry = type === 'Entrada'
  const Icon = isEntry ? ArrowDownLeft : ArrowUpRight
  return <span className={`movement-type ${isEntry ? 'type-entry' : type === 'Salida' ? 'type-exit' : 'type-adjust'}`}><Icon size={13} />{type}</span>
}

function Products() {
  const products = useCollection('/productos')
  const categories = useCollection('/categorias')
  const suppliers = useCollection('/proveedores')
  const [form, setForm] = useState(blankProduct)
  const [notice, setNotice] = useState('')
  const [saving, setSaving] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState('')
  const editing = Boolean(form.id)
  const change = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  const listing = usePagedResults(products.data, (product, query) => {
    const categoryName = categories.data.find((item) => String(item.id) === String(product.categoria_id))?.nombre || ''
    const matchesQuery = !query || [product.nombre, product.id, categoryName].some((value) => String(value || '').toLocaleLowerCase('es-PE').includes(query))
    return matchesQuery && (!categoryFilter || String(product.categoria_id) === categoryFilter)
  })

  const create = () => {
    setForm(blankProduct)
    setNotice('')
    setFormOpen(true)
  }

  const save = async (event) => {
    event.preventDefault()
    setSaving(true)
    setNotice('')
    try {
      const { id, ...payload } = form
      if (editing) await api.put(`/productos/${id}`, payload)
      else await api.post('/productos', payload)
      setForm(blankProduct)
      setFormOpen(false)
      setNotice(editing ? 'Producto actualizado.' : 'Producto creado.')
      products.reload()
    } catch (error) { setNotice(error.response?.data?.message || 'No se pudo guardar el producto.') }
    finally { setSaving(false) }
  }
  const edit = (product) => {
    setNotice('')
    setForm({ id: product.id, nombre: product.nombre || '', descripcion: product.descripcion || '', precio: product.precio || '', categoria_id: product.categoria_id ? String(product.categoria_id) : '', proveedor_id: product.proveedor_id ? String(product.proveedor_id) : '' })
    setFormOpen(true)
  }
  const remove = async (id) => {
    if (!window.confirm('¿Eliminar este producto?')) return
    try { await api.delete(`/productos/${id}`); products.reload(); setNotice('Producto eliminado.') }
    catch (error) { setNotice(error.response?.data?.message || 'No se pudo eliminar el producto.') }
  }

  return <>
    <PageHeading eyebrow="CATÁLOGO" title="Productos" detail="Administra existencias, precios y relaciones del catálogo." action={<button className="button button-primary" onClick={create}><CirclePlus size={17} />Nuevo producto</button>} />
    <Notice error={notice.startsWith('No ')}>{notice}</Notice>
    {categories.data.length === 0 && !categories.loading && <Notice error>Primero crea una categoría para poder registrar productos.</Notice>}
    <section className="surface table-surface">
      <div className="section-heading"><div><p className="eyebrow">INVENTARIO</p><h2>Lista de Productos</h2></div><button className="icon-button" title="Actualizar" aria-label="Actualizar productos" onClick={products.reload}><RotateCcw size={16} /></button></div>
      <div className="table-toolbar"><SearchInput value={listing.query} onChange={listing.updateQuery} placeholder="Buscar por Nombre o Categoría..." /><select className="filter-select" aria-label="Filtrar por categoría" value={categoryFilter} onChange={(event) => { setCategoryFilter(event.target.value); listing.setPage(1) }}><option value="">Todas las categorías</option>{categories.data.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}</select></div>
      <LoadingOrError loading={products.loading} error={products.error} />
      {!products.loading && !products.error && <div className="table-wrap"><table><thead><tr><th>ID</th><th>Nombre</th><th>Categoría</th><th>Precio</th><th>Stock</th><th>Acciones</th></tr></thead><tbody>
        {listing.visible.length ? listing.visible.map((product) => <tr key={product.id}><td>{formatId(product.id)}</td><td className="primary-cell">{product.nombre}</td><td>{categories.data.find((item) => String(item.id) === String(product.categoria_id))?.nombre || 'Sin categoría'}</td><td>{formatPrice(product.precio)}</td><td><span className={`stock-pill${Number(product.stock) <= 5 ? ' stock-pill-low' : ''}`}>{product.stock}</span></td><td className="actions-cell"><button className="table-action edit-action" title="Editar" onClick={() => edit(product)}><Pencil size={13} />Editar</button><button className="table-action delete-action" title="Eliminar" onClick={() => remove(product.id)}><Trash2 size={13} />Eliminar</button></td></tr>) : <EmptyRow columns={6}>{listing.filtered.length ? 'No hay resultados para esa búsqueda.' : 'No hay productos registrados.'}</EmptyRow>}
      </tbody></table></div>}
      {!products.loading && !products.error && <Pagination page={listing.page} pageCount={listing.pageCount} total={listing.filtered.length} onPageChange={listing.setPage} />}
    </section>
    {formOpen && <Modal title={editing ? 'Editar producto' : 'Nuevo producto'} onClose={() => setFormOpen(false)}>
      <form className="form-grid product-form" onSubmit={save}>
        <Field label="Nombre" required><input name="nombre" value={form.nombre} onChange={change} required /></Field>
        <Field label="Categoría" required><select name="categoria_id" value={form.categoria_id} onChange={change} required><option value="">Selecciona categoría</option>{categories.data.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}</select></Field>
        <Field label="Precio (S/)" required><input name="precio" type="number" min="0" step="0.01" value={form.precio} onChange={change} required /></Field>
        <Field label="Proveedor"><select name="proveedor_id" value={form.proveedor_id} onChange={change}><option value="">Sin proveedor</option>{suppliers.data.map((item) => <option key={item.id} value={item.id}>{item.razon_social}</option>)}</select></Field>
        <Field label="Descripción" wide><textarea name="descripcion" rows="2" value={form.descripcion} onChange={change} /></Field>
        <div className="form-actions"><button className="button button-subtle" type="button" onClick={() => setFormOpen(false)}>Cancelar</button><button className="button button-primary" type="submit" disabled={saving || categories.data.length === 0}>{saving ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear producto'}</button></div>
      </form>
    </Modal>}
  </>
}

function Field({ label, required, wide, children }) {
  return <label className={`field${wide ? ' field-wide' : ''}`}><span>{label}{required && <b> *</b>}</span>{children}</label>
}

function Categories() {
  const products = useCollection('/productos')
  return <ResourceManager resource="categorias" title="Categorías" eyebrow="ORGANIZACIÓN DEL CATÁLOGO" detail="Agrupa productos para mantener el catálogo ordenado." fields={[{ name: 'nombre', label: 'Nombre', required: true }, { name: 'descripcion', label: 'Descripción', multiline: true }]} blank={blankCategory} columns={[['nombre', 'Nombre'], ['descripcion', 'Descripción'], ['cantidad', 'Cant. productos', (category) => products.data.filter((product) => String(product.categoria_id) === String(category.id)).length]]} searchPlaceholder="Buscar por Nombre..." />
}

function Suppliers() {
  return <ResourceManager resource="proveedores" title="Proveedores" eyebrow="RED DE SUMINISTRO" detail="Mantén a mano los datos de contacto de tus proveedores." fields={[{ name: 'razon_social', label: 'Razón social', required: true }, { name: 'contacto', label: 'Persona de contacto' }, { name: 'telefono', label: 'Teléfono' }, { name: 'email', label: 'Correo electrónico', type: 'email' }]} blank={blankSupplier} columns={[['razon_social', 'Razón Social'], ['contacto', 'Contacto'], ['telefono', 'Teléfono'], ['email', 'Email']]} searchPlaceholder="Buscar por Razón Social o Contacto..." />
}

function ResourceManager({ resource, title, eyebrow, detail, fields, blank, columns, searchPlaceholder }) {
  const [formOpen, setFormOpen] = useState(false)
  const collection = useCollection(`/${resource}`)
  const [form, setForm] = useState(blank)
  const [notice, setNotice] = useState('')
  const [saving, setSaving] = useState(false)
  const editing = Boolean(form.id)
  const change = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  const listing = usePagedResults(collection.data, (item, query) => !query || Object.values(item).some((value) => String(value || '').toLocaleLowerCase('es-PE').includes(query)))

  const create = () => {
    setForm(blank)
    setNotice('')
    setFormOpen(true)
  }

  const save = async (event) => {
    event.preventDefault()
    setSaving(true)
    setNotice('')
    try {
      const { id, ...payload } = form
      if (editing) await api.put(`/${resource}/${id}`, payload)
      else await api.post(`/${resource}`, payload)
      setNotice(editing ? 'Registro actualizado.' : 'Registro creado.')
      setForm(blank)
      setFormOpen(false)
      collection.reload()
    } catch (error) { setNotice(error.response?.data?.message || `No se pudo guardar ${title.toLowerCase()}.`) }
    finally { setSaving(false) }
  }
  const remove = async (item) => {
    if (!window.confirm(`¿Eliminar ${item.nombre || item.razon_social}?`)) return
    try { await api.delete(`/${resource}/${item.id}`); collection.reload(); setNotice('Registro eliminado.') }
    catch (error) { setNotice(error.response?.data?.message || 'No se pudo eliminar. Puede tener registros asociados.') }
  }

  return <>
    <PageHeading eyebrow={eyebrow} title={title} detail={detail} action={<button className="button button-primary" onClick={create}><CirclePlus size={17} />{resource === 'categorias' ? 'Nueva categoría' : 'Nuevo proveedor'}</button>} />
    <Notice error={notice.startsWith('No ')}>{notice}</Notice>
    <section className="surface table-surface">
      <div className="section-heading"><div><p className="eyebrow">LISTADO</p><h2>Lista de {title}</h2></div><button className="icon-button" title="Actualizar" aria-label={`Actualizar ${title.toLowerCase()}`} onClick={collection.reload}><RotateCcw size={16} /></button></div>
      <div className="table-toolbar"><SearchInput value={listing.query} onChange={listing.updateQuery} placeholder={searchPlaceholder} /></div>
      <LoadingOrError loading={collection.loading} error={collection.error} />
      {!collection.loading && !collection.error && <div className="table-wrap"><table><thead><tr>{columns.map(([, label]) => <th key={label}>{label}</th>)}<th></th></tr></thead><tbody>
        {listing.visible.length ? listing.visible.map((item) => <tr key={item.id}><td>{formatId(item.id)}</td>{columns.map(([key, , render], index) => <td className={index === 0 ? 'primary-cell' : ''} key={key}>{render ? render(item) : item[key] || '—'}</td>)}<td className="actions-cell"><button className="table-action edit-action" title="Editar" onClick={() => { setForm(item); setNotice(''); setFormOpen(true) }}><Pencil size={13} />Editar</button><button className="table-action delete-action" title="Eliminar" onClick={() => remove(item)}><Trash2 size={13} />Eliminar</button></td></tr>) : <EmptyRow columns={columns.length + 2}>{listing.filtered.length ? 'No hay resultados para esa búsqueda.' : `No hay ${title.toLowerCase()} registrados.`}</EmptyRow>}
      </tbody></table></div>}
      {!collection.loading && !collection.error && <Pagination page={listing.page} pageCount={listing.pageCount} total={listing.filtered.length} onPageChange={listing.setPage} />}
    </section>
    {formOpen && <Modal title={editing ? `Editar ${resource === 'categorias' ? 'categoría' : 'proveedor'}` : resource === 'categorias' ? 'Nueva categoría' : 'Nuevo proveedor'} onClose={() => setFormOpen(false)}>
      <form className="form-grid" onSubmit={save}>{fields.map((field) => <Field key={field.name} label={field.label} required={field.required} wide={field.multiline}>{field.multiline ? <textarea name={field.name} rows="2" value={form[field.name] || ''} onChange={change} /> : <input name={field.name} type={field.type || 'text'} value={form[field.name] || ''} onChange={change} required={field.required} />}</Field>)}<div className="form-actions"><button className="button button-subtle" type="button" onClick={() => setFormOpen(false)}>Cancelar</button><button className="button button-primary" type="submit" disabled={saving}>{saving ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear registro'}</button></div></form>
    </Modal>}
  </>
}

function Ledger() {
  const movements = useCollection('/movimientos')
  const products = useCollection('/productos')
  const users = useCollection('/usuarios')
  const [form, setForm] = useState(blankMovement)
  const [notice, setNotice] = useState('')
  const [saving, setSaving] = useState(false)
  const [selectedMove, setSelectedMove] = useState(null)
  const change = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  const listing = usePagedResults(movements.data, (move, query) => {
    const searchable = [move.id, move.tipo_movimiento, move.producto?.nombre, move.usuario?.nombre, move.observaciones]
    return !query || searchable.some((value) => String(value || '').toLocaleLowerCase('es-PE').includes(query))
  })
  const save = async (event) => {
    event.preventDefault()
    setSaving(true)
    setNotice('')
    try {
      await api.post('/movimientos', { ...form, cantidad: Number(form.cantidad), producto_id: Number(form.producto_id), usuario_id: Number(form.usuario_id) })
      setForm(blankMovement)
      setNotice('Movimiento registrado y stock actualizado.')
      movements.reload()
      products.reload()
    } catch (error) { setNotice(error.response?.data?.message || 'No se pudo registrar el movimiento.') }
    finally { setSaving(false) }
  }

  return <>
    <PageHeading eyebrow="TRAZABILIDAD DE EXISTENCIAS" title="Kardex" detail="Cada entrada o salida queda asociada a un producto y responsable." />
    <Notice error={notice.startsWith('No ') || notice.includes('suficiente')}>{notice}</Notice>
    {users.data.length === 0 && !users.loading && <Notice error>No hay usuarios registrados. Se necesita un usuario para asignar responsable a cada movimiento.</Notice>}
    <section className="surface form-surface ledger-form-surface">
      <div className="section-heading"><div><p className="eyebrow">NUEVO REGISTRO</p><h2>Registrar movimiento</h2></div><span className="ledger-mark"><ClipboardList size={18} /></span></div>
      <form className="form-grid ledger-form" onSubmit={save}>
        <Field label="Producto" required><select name="producto_id" value={form.producto_id} onChange={change} required><option value="">Selecciona producto</option>{products.data.map((item) => <option key={item.id} value={item.id}>{item.nombre} · {item.stock} uds.</option>)}</select></Field>
        <Field label="Responsable" required><select name="usuario_id" value={form.usuario_id} onChange={change} required><option value="">Selecciona usuario</option>{users.data.map((item) => <option key={item.id} value={item.id}>{item.nombre} · {item.rol}</option>)}</select></Field>
        <Field label="Tipo de movimiento" required><select name="tipo_movimiento" value={form.tipo_movimiento} onChange={change}><option>Entrada</option><option>Salida</option><option>Ajuste</option></select></Field>
        <Field label={form.tipo_movimiento === 'Ajuste' ? 'Stock contado' : 'Cantidad'} required><input name="cantidad" type="number" min={form.tipo_movimiento === 'Ajuste' ? '0' : '1'} step="1" value={form.cantidad} onChange={change} required /></Field>
        <Field label="Observaciones"><input name="observaciones" value={form.observaciones} onChange={change} placeholder="Motivo o referencia" /></Field>
        <div className="form-actions"><span /> <button className="button button-primary" type="submit" disabled={saving || !products.data.length || !users.data.length}>{saving ? 'Registrando...' : 'Registrar movimiento'}</button></div>
      </form>
    </section>
    <section className="surface table-surface">
      <div className="section-heading"><div><p className="eyebrow">HISTORIAL</p><h2>Movimientos registrados</h2></div><button className="icon-button" title="Actualizar" aria-label="Actualizar movimientos" onClick={movements.reload}><RotateCcw size={16} /></button></div>
      <div className="table-toolbar"><SearchInput value={listing.query} onChange={listing.updateQuery} placeholder="Buscar por producto, tipo o usuario..." /></div>
      <LoadingOrError loading={movements.loading} error={movements.error} />
      {!movements.loading && !movements.error && <div className="table-wrap"><table><thead><tr><th>ID</th><th>Fecha / Hora</th><th>Producto</th><th>Tipo</th><th>Cantidad</th><th>Usuario</th><th>Acciones</th></tr></thead><tbody>
        {listing.visible.length ? listing.visible.map((move) => <tr key={move.id}><td>{formatId(move.id)}</td><td>{move.fecha_hora ? new Date(move.fecha_hora).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' }) : '—'}</td><td className="primary-cell">{move.producto?.nombre || `#${move.producto_id}`}</td><td><MovementType type={move.tipo_movimiento} /></td><td className={`movement-quantity ${move.tipo_movimiento === 'Salida' ? 'quantity-out' : 'quantity-in'}`}>{move.tipo_movimiento === 'Salida' ? '−' : '+'}{move.cantidad}</td><td>{move.usuario?.nombre || `#${move.usuario_id}`}</td><td className="actions-cell"><button className="table-action view-action" title="Ver movimiento" onClick={() => setSelectedMove(move)}><Eye size={13} />Ver</button></td></tr>) : <EmptyRow columns={7}>{listing.filtered.length ? 'No hay resultados para esa búsqueda.' : 'El historial aparecerá aquí al registrar movimientos.'}</EmptyRow>}
      </tbody></table></div>}
      {!movements.loading && !movements.error && <Pagination page={listing.page} pageCount={listing.pageCount} total={listing.filtered.length} onPageChange={listing.setPage} />}
    </section>
    {selectedMove && <Modal title="Detalle del movimiento" onClose={() => setSelectedMove(null)}>
      <dl className="settings-list movement-details"><div><dt>Fecha / Hora</dt><dd>{selectedMove.fecha_hora ? new Date(selectedMove.fecha_hora).toLocaleString('es-PE') : '—'}</dd></div><div><dt>Producto</dt><dd>{selectedMove.producto?.nombre || `#${selectedMove.producto_id}`}</dd></div><div><dt>Tipo</dt><dd><MovementType type={selectedMove.tipo_movimiento} /></dd></div><div><dt>Cantidad</dt><dd>{selectedMove.cantidad}</dd></div><div><dt>Usuario</dt><dd>{selectedMove.usuario?.nombre || `#${selectedMove.usuario_id}`}</dd></div><div><dt>Observaciones</dt><dd>{selectedMove.observaciones || '—'}</dd></div></dl>
    </Modal>}
  </>
}

function Users() {
  const users = useCollection('/usuarios')
  const listing = usePagedResults(users.data, (user, query) => !query || [user.nombre, user.email, user.rol].some((value) => String(value || '').toLocaleLowerCase('es-PE').includes(query)))

  return <>
    <PageHeading eyebrow="PERSONAS Y ACCESOS" title="Usuarios" detail="Consulta las cuentas habilitadas para registrar movimientos." />
    <Notice>La API solo permite consultar usuarios; no se muestran ni se modifican contraseñas desde este panel.</Notice>
    <section className="surface table-surface">
      <div className="section-heading"><div><p className="eyebrow">DIRECTORIO</p><h2>Usuarios registrados</h2></div><button className="icon-button" title="Actualizar" aria-label="Actualizar usuarios" onClick={users.reload}><RotateCcw size={16} /></button></div>
      <div className="table-toolbar"><SearchInput value={listing.query} onChange={listing.updateQuery} placeholder="Buscar por Nombre o Email..." /></div>
      <LoadingOrError loading={users.loading} error={users.error} />
      {!users.loading && !users.error && <div className="table-wrap"><table><thead><tr><th>ID</th><th>Nombre</th><th>Correo electrónico</th><th>Rol</th></tr></thead><tbody>
        {listing.visible.length ? listing.visible.map((user) => <tr key={user.id}><td>{formatId(user.id)}</td><td className="primary-cell">{user.nombre}</td><td>{user.email}</td><td><span className="role-badge">{user.rol}</span></td></tr>) : <EmptyRow columns={4}>{listing.filtered.length ? 'No hay resultados para esa búsqueda.' : 'No hay usuarios registrados.'}</EmptyRow>}
      </tbody></table></div>}
      {!users.loading && !users.error && <Pagination page={listing.page} pageCount={listing.pageCount} total={listing.filtered.length} onPageChange={listing.setPage} />}
    </section>
  </>
}

function Settings() {
  const apiAddress = import.meta.env.VITE_API_URL || 'Proxy local de Vite (/api)'

  return <>
    <PageHeading eyebrow="SISTEMA" title="Configuración" detail="Información de conexión del panel de inventario." />
    <section className="surface settings-surface">
      <div className="section-heading"><div><p className="eyebrow">CONEXIÓN</p><h2>API de inventario</h2></div><Settings2 size={18} className="chart-heading-icon" /></div>
      <dl className="settings-list"><div><dt>Origen configurado</dt><dd>{apiAddress}</dd></div><div><dt>Estado de la API</dt><dd><span className="role-badge">Se verifica al cargar cada vista</span></dd></div></dl>
      <Notice>Las credenciales de usuarios se administran fuera de este panel.</Notice>
    </section>
  </>
}

export default function Panel({ view }) {
  if (view === 'products') return <Products />
  if (view === 'categories') return <Categories />
  if (view === 'suppliers') return <Suppliers />
  if (view === 'ledger') return <Ledger />
  if (view === 'users') return <Users />
  if (view === 'settings') return <Settings />
  return <Dashboard />
}