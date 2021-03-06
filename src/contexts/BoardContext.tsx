import {
  createContext,
  ReactNode,
  useCallback,
  useEffect,
  useState,
} from "react";

import { Card, List, MoveCardParams } from "../types";

import { getDataFromStorage, saveDataInStorage } from "../utils/storage";
import { generateID } from "../utils/generateID";
import { CreateCardModal } from "../components/CreateCardModal";

interface BoardContext {
  lists: List[];
  addList: (name: string) => void;
  removeList: (id: string) => void;
  renameList: (id: string, name: string) => void;
  openCreateCardModal: (listId: string) => void;
  createCard: (card: Omit<Card, "id">) => void;
  moveCard: (params: MoveCardParams) => void;
}

interface BoardContextProviderProps {
  children: ReactNode;
}

export const BoardContext = createContext({} as BoardContext);

export function BoardContextProvider({ children }: BoardContextProviderProps) {
  const [lists, setLists] = useState<List[]>([]);
  const [isCreateCardModalOpen, setIsCreateCardModalOpen] = useState(false);
  const [creatingListId, setCreatingListId] = useState("");

  useEffect(() => {
    setLists(getDataFromStorage());
  }, []);

  function updateData(newLists: List[]) {
    setLists(newLists);
    saveDataInStorage(newLists);
  }

  const addList = useCallback(
    (name: string) => {
      const newList = {
        id: generateID(),
        name,
        cards: [],
      };

      const nesLists = [...lists, newList];

      updateData(nesLists);
    },
    [lists]
  );

  const removeList = useCallback(
    (id: string) => {
      const newData = lists.filter((list) => {
        return list.id !== id;
      });

      updateData(newData);
    },
    [lists]
  );

  const renameList = useCallback(
    (id: string, name: string) => {
      const newData = lists.map((list) => {
        if (list.id === id) {
          list.name = name;
        }

        return list;
      });

      updateData(newData);
    },
    [lists]
  );

  const createCard = useCallback(
    (cardData: Omit<Card, "id">) => {
      if (!creatingListId.length) {
        return;
      }

      const newCard = { id: generateID(), ...cardData };

      const newData = lists.map((list) => {
        if (list.id === creatingListId) {
          list.cards.push(newCard);
        }

        return list;
      });

      updateData(newData);
    },
    [creatingListId, lists]
  );

  const moveCard = useCallback(
    ({ indexes }: MoveCardParams) => {
      const newLists = [...lists];

      const draggedCard = newLists[indexes.list.from].cards[indexes.card.from];

      if (indexes.card.to !== undefined) {
        newLists[indexes.list.from].cards.splice(indexes.card.from, 1);
        newLists[indexes.list.to].cards.splice(indexes.card.to, 0, draggedCard);
      } else {
        newLists[indexes.list.from].cards.splice(indexes.card.from, 1);
        newLists[indexes.list.to].cards.push(draggedCard);
      }

      updateData(newLists);
    },
    [lists]
  );

  const openCreateCardModal = useCallback((listId: string) => {
    setCreatingListId(listId);
    setIsCreateCardModalOpen(true);
  }, []);

  const closeCreateCardModal = useCallback(() => {
    setIsCreateCardModalOpen(false);
  }, []);

  return (
    <BoardContext.Provider
      value={{
        lists,
        addList,
        removeList,
        renameList,
        openCreateCardModal,
        createCard,
        moveCard,
      }}
    >
      {children}

      <CreateCardModal
        isOpen={isCreateCardModalOpen}
        onRequestClose={closeCreateCardModal}
      />
    </BoardContext.Provider>
  );
}
