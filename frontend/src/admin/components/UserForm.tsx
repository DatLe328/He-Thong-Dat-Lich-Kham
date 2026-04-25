import { useState, useEffect } from "react";

export default function UserForm({ onSubmit, onClose, initial }: any) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("user");

  useEffect(() => {
    if (initial) {
      setEmail(initial.email);
      setRole(initial.role);
    }
  }, [initial]);

  return (
    <div className="modal">
      <div className="modal-content">
        <h3>{initial ? "Edit User" : "Create User"}</h3>

        <input value={email} onChange={e => setEmail(e.target.value)} />
        <select value={role} onChange={e => setRole(e.target.value)}>
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>

        <button onClick={() => onSubmit({ ...initial, email, role })}>Save</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}