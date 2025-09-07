import React from "react";
import type { User } from "../../types";

interface UserListProps {
  usuarios: User[];
}

const UserList: React.FC<UserListProps> = ({ usuarios }) => {
  return (
    <ul className="user-list">
      {usuarios.map((usuario) => (
        <li key={usuario.id}> {/* <-- key adicionada */}
          {usuario.apelido} ({usuario.email})
        </li>
      ))}
    </ul>
  );
};

export default UserList;