export async function updateClass(id: string | number, payload: Record<string, unknown>) {
  return fetch(`/api/class/update`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ...payload, id }),
  });
}

export async function deleteClass(id: string | number) {
  return fetch(`/api/class/delete?id=${id}`, {
    method: 'DELETE',
  });
}
