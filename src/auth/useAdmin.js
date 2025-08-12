import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

export default function useAdmin(user) {
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!user) return mounted && setIsAdmin(false);
      try {
        const snap = await getDoc(doc(db, "admins", user.uid));
        mounted && setIsAdmin(snap.exists());
      } catch {
        mounted && setIsAdmin(false);
      }
    })();
    return () => { mounted = false; };
  }, [user]);
  return isAdmin;
}
