import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import App from '../App.vue'

describe('App', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ message: 'Request successful.' }),
      }),
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('submits signup data directly to the signup API', async () => {
    const wrapper = mount(App)

    await wrapper.find('[name="name"]').setValue('Alex Morgan')
    await wrapper.find('[name="username"]').setValue('alex')
    await wrapper.find('[name="password"]').setValue('secret123')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(fetch).toHaveBeenCalledWith('http://localhost:8080/users/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'alex',
        password: 'secret123',
        name: 'Alex Morgan',
      }),
    })
    expect(wrapper.find('[role="status"]').text()).toBe('Request successful.')
  })

  it('submits login data directly to the login API', async () => {
    const wrapper = mount(App)

    await wrapper.find('.mode-switch button:last-child').trigger('click')
    await wrapper.find('[name="username"]').setValue('alex')
    await wrapper.find('[name="password"]').setValue('secret123')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.find('[name="name"]').exists()).toBe(false)
    expect(fetch).toHaveBeenCalledWith('http://localhost:8080/users/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'alex',
        password: 'secret123',
      }),
    })
  })

  it('shows API errors in the form', async () => {
    fetch.mockResolvedValue({
      ok: false,
      status: 409,
      text: async () => JSON.stringify({ message: 'Username already exists.' }),
    })
    const wrapper = mount(App)

    await wrapper.find('[name="name"]').setValue('Alex Morgan')
    await wrapper.find('[name="username"]').setValue('alex')
    await wrapper.find('[name="password"]').setValue('secret123')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.find('[role="status"]').text()).toBe('Username already exists.')
    expect(wrapper.find('[role="status"]').classes()).toContain('error')
  })
})
