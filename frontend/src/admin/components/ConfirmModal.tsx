export default function ConfirmModal({ onConfirm, onCancel }: any) {
  return (
    <div className="modal">
      <div className="modal-content">
        <p>Are you sure?</p>
        <button onClick={onConfirm}>Yes</button>
        <button onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}